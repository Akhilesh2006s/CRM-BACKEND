const User = require('../models/User');
const Leave = require('../models/Leave');
const DC = require('../models/DC');
const Lead = require('../models/Lead');
const ExcelJS = require('exceljs');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res) => {
  try {
    const { isActive, role, department } = req.query;
    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (role) filter.role = role;
    if (department) filter.department = department;

    const employees = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create employee
// @route   POST /api/employees/create
// @access  Private
const createEmployee = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.password) {
      body.password = 'Password123';
    }
    if (!body.name && body.firstName) {
      body.name = `${body.firstName} ${body.lastName || ''}`.trim();
    }
    const employee = await User.create(body);
    const employeeData = await User.findById(employee._id).select('-password');
    res.status(201).json(employeeData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
const updateEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        employee[key] = req.body[key];
      }
    });

    // If password is being updated, ensure it's set (will be hashed by pre-save hook)
    if (req.body.password) {
      employee.password = req.body.password;
    }

    await employee.save();

    const employeeData = await User.findById(employee._id).select('-password');
    res.json(employeeData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset employee password to default
// @route   PUT /api/employees/:id/reset-password
// @access  Private
const resetEmployeePassword = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.password = 'Password123';
    await employee.save();

    res.json({ message: 'Password reset to Password123 successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee leaves
// @route   GET /api/employees/:id/leaves
// @access  Private
const getEmployeeLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.params.id })
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee tracking data
// @route   GET /api/employees/tracking
// @access  Private
const getEmployeeTracking = async (req, res) => {
  try {
    const { employeeId, fromDate, toDate } = req.query;
    
    // Get all active employees
    const employeeFilter = { isActive: true, role: { $in: ['Employee', 'Executive', 'Manager'] } };
    if (employeeId) employeeFilter._id = employeeId;
    
    const employees = await User.find(employeeFilter).select('-password');
    
    // Get tracking data for each employee
    const trackingData = await Promise.all(
      employees.map(async (employee) => {
        // Get DCs created by or assigned to employee
        const dcFilter = {
          $or: [
            { employeeId: employee._id },
            { createdBy: employee._id }
          ]
        };
        
        // Get Leads created by or managed by employee
        const leadFilter = {
          $or: [
            { createdBy: employee._id },
            { managed_by: employee._id },
            { assigned_by: employee._id }
          ]
        };
        
        if (fromDate || toDate) {
          const dateFilter = {};
          if (fromDate) dateFilter.$gte = new Date(fromDate);
          if (toDate) dateFilter.$lte = new Date(toDate + 'T23:59:59.999Z');
          
          dcFilter.createdAt = dateFilter;
          leadFilter.createdAt = dateFilter;
        }
        
        const dcs = await DC.find(dcFilter)
          .populate('dcOrderId', 'location zone')
          .sort({ createdAt: 1 });
        
        const leads = await Lead.find(leadFilter).sort({ createdAt: 1 });
        
        // Combine all activities
        const allActivities = [
          ...dcs.map(dc => ({
            type: 'DC',
            date: dc.createdAt,
            location: dc.dcOrderId?.location || dc.customerAddress || ''
          })),
          ...leads.map(lead => ({
            type: 'Lead',
            date: lead.createdAt,
            location: lead.location || ''
          }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const started = allActivities.length > 0 ? allActivities[0].date : employee.createdAt;
        const lastUsed = allActivities.length > 0 ? allActivities[allActivities.length - 1].date : employee.lastLogin || employee.updatedAt;
        const lastLocation = allActivities.length > 0 ? allActivities[allActivities.length - 1].location : '';
        const logCount = allActivities.length;
        
        return {
          _id: employee._id,
          employeeName: employee.name,
          mobileNo: employee.mobile || employee.phone || '',
          zone: employee.zone || '',
          started: started,
          lastUsed: lastUsed,
          lastLocation: lastLocation,
          logCount: logCount,
        };
      })
    );
    
    res.json(trackingData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export employee tracking to Excel
// @route   GET /api/employees/tracking/export
// @access  Private
const exportEmployeeTracking = async (req, res) => {
  try {
    const { employeeId, fromDate, toDate } = req.query;
    
    const employeeFilter = { isActive: true, role: { $in: ['Employee', 'Executive', 'Manager'] } };
    if (employeeId) employeeFilter._id = employeeId;
    
    const employees = await User.find(employeeFilter).select('-password');
    
    const trackingData = await Promise.all(
      employees.map(async (employee) => {
        const dcFilter = {
          $or: [
            { employeeId: employee._id },
            { createdBy: employee._id }
          ]
        };
        
        const leadFilter = {
          $or: [
            { createdBy: employee._id },
            { managed_by: employee._id },
            { assigned_by: employee._id }
          ]
        };
        
        if (fromDate || toDate) {
          const dateFilter = {};
          if (fromDate) dateFilter.$gte = new Date(fromDate);
          if (toDate) dateFilter.$lte = new Date(toDate + 'T23:59:59.999Z');
          
          dcFilter.createdAt = dateFilter;
          leadFilter.createdAt = dateFilter;
        }
        
        const dcs = await DC.find(dcFilter)
          .populate('dcOrderId', 'location zone')
          .sort({ createdAt: 1 });
        
        const leads = await Lead.find(leadFilter).sort({ createdAt: 1 });
        
        const allActivities = [
          ...dcs.map(dc => ({
            type: 'DC',
            date: dc.createdAt,
            location: dc.dcOrderId?.location || dc.customerAddress || ''
          })),
          ...leads.map(lead => ({
            type: 'Lead',
            date: lead.createdAt,
            location: lead.location || ''
          }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const started = allActivities.length > 0 ? allActivities[0].date : employee.createdAt;
        const lastUsed = allActivities.length > 0 ? allActivities[allActivities.length - 1].date : employee.lastLogin || employee.updatedAt;
        const lastLocation = allActivities.length > 0 ? allActivities[allActivities.length - 1].location : '';
        const logCount = allActivities.length;
        
        return {
          employeeName: employee.name,
          mobileNo: employee.mobile || employee.phone || '',
          zone: employee.zone || '',
          started: started,
          lastUsed: lastUsed,
          lastLocation: lastLocation,
          logCount: logCount,
        };
      })
    );
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employee Tracking Report');

    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Mobile No', key: 'mobileNo', width: 15 },
      { header: 'Zone', key: 'zone', width: 20 },
      { header: 'Started', key: 'started', width: 20 },
      { header: 'Last Used', key: 'lastUsed', width: 20 },
      { header: 'Last Location', key: 'lastLocation', width: 50 },
      { header: 'Log Count', key: 'logCount', width: 12 },
    ];

    trackingData.forEach((data, index) => {
      worksheet.addRow({
        sno: index + 1,
        employeeName: data.employeeName,
        mobileNo: data.mobileNo,
        zone: data.zone,
        started: data.started ? new Date(data.started).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
        lastUsed: data.lastUsed ? new Date(data.lastUsed).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
        lastLocation: data.lastLocation,
        logCount: data.logCount,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Employee_Tracking_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  getEmployeeLeaves,
  resetEmployeePassword,
  getEmployeeTracking,
  exportEmployeeTracking,
};

