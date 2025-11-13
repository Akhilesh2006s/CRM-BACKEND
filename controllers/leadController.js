const Lead = require('../models/Lead');
const ExcelJS = require('exceljs');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
  try {
    const { 
      status, 
      assignedTo, 
      zone, 
      employee, 
      priority, 
      schoolName, 
      contactMobile, 
      fromDate, 
      toDate 
    } = req.query;
    const filter = {};

    if (status) {
      // Handle multiple statuses (comma-separated)
      if (status.includes(',')) {
        filter.status = { $in: status.split(',').map(s => s.trim()) };
      } else {
        filter.status = status;
      }
    }
    if (zone) filter.zone = { $regex: zone, $options: 'i' };
    if (priority) filter.priority = priority;
    if (schoolName) filter.school_name = { $regex: schoolName, $options: 'i' };
    if (contactMobile) filter.contact_mobile = { $regex: contactMobile, $options: 'i' };
    
    // Date filtering
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
    }
    
    // Backward compatible: some schemas use assignedTo, others use managed_by/assigned_by
    if (assignedTo || employee) {
      const employeeId = assignedTo || employee;
      filter.$or = [
        { assignedTo: employeeId },
        { managed_by: employeeId },
        { assigned_by: employeeId },
      ];
    }

    // Pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Default 50 items per page
    const skip = (page - 1) * limit;

    // Get total count for pagination - use estimatedDocumentCount for better performance if no filters
    // Otherwise use countDocuments with timeout
    let total;
    try {
      if (Object.keys(filter).length === 0) {
        total = await Promise.race([
          Lead.estimatedDocumentCount(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Count timeout')), 10000))
        ]);
      } else {
        total = await Promise.race([
          Lead.countDocuments(filter),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Count timeout')), 10000))
        ]);
      }
    } catch (countError) {
      // If count times out, use a default or estimate
      console.warn('Count query timed out, using estimate');
      total = 0; // Will be updated as data loads
    }

    // Query with pagination - optimized for performance
    // Only populate essential fields for list view
    const query = Lead.find(filter)
      .select('school_name contact_person contact_mobile zone status follow_up_date location strength createdAt remarks school_type priority assignedTo managed_by assigned_by') // Only select needed fields
      .populate('assignedTo', 'name email') // Only populate assignedTo for list view
      .populate('managed_by', 'name email')
      .populate('assigned_by', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() // Use lean() for better performance
      .maxTimeMS(30000); // 30 second timeout at MongoDB level
    
    const leads = await query;

    // Return paginated response
    res.json({
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create lead
// @route   POST /api/leads/create
// @access  Private
const createLead = async (req, res) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedLead = await Lead.findById(lead._id)
      .populate('createdBy', 'name email');

    res.status(201).json(populatedLead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // For leads, we'll store history in a simple format
    // Since Lead model doesn't have updateHistory, we'll update directly
    // History can be tracked via timestamps and status changes
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email');

    res.json(updatedLead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export leads to Excel
// @route   GET /api/leads/export
// @access  Private
const exportLeads = async (req, res) => {
  try {
    const { 
      status, 
      zone, 
      employee, 
      priority, 
      schoolName, 
      contactMobile, 
      fromDate, 
      toDate 
    } = req.query;
    const filter = {};

    if (status) {
      // Handle multiple statuses (comma-separated)
      if (status.includes(',')) {
        filter.status = { $in: status.split(',').map(s => s.trim()) };
      } else {
        filter.status = status;
      }
    }
    if (zone) filter.zone = { $regex: zone, $options: 'i' };
    if (priority) filter.priority = priority;
    if (schoolName) filter.school_name = { $regex: schoolName, $options: 'i' };
    if (contactMobile) filter.contact_mobile = { $regex: contactMobile, $options: 'i' };
    
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
    }
    
    if (employee) {
      filter.$or = [
        { managed_by: employee },
        { assigned_by: employee },
      ];
    }

    const leads = await Lead.find(filter)
      .populate('createdBy', 'name email')
      .populate('managed_by', 'name email')
      .populate('assigned_by', 'name email')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    // Define columns
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Created On', key: 'createdOn', width: 20 },
      { header: 'Zone', key: 'zone', width: 12 },
      { header: 'Assigned To', key: 'assignedTo', width: 20 },
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Location', key: 'location', width: 30 },
      { header: 'School Name', key: 'schoolName', width: 30 },
      { header: 'Contact Person', key: 'contactPerson', width: 20 },
      { header: 'Decision Maker', key: 'decisionMaker', width: 20 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Follow-up On', key: 'followUpOn', width: 20 },
      { header: 'School Strength', key: 'schoolStrength', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Add data
    leads.forEach((lead, index) => {
      const assignedTo = lead.managed_by?.name || lead.assigned_by?.name || lead.createdBy?.name || 'Not Assigned';
      worksheet.addRow({
        sno: index + 1,
        createdOn: lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
        zone: lead.zone || '',
        assignedTo: assignedTo,
        priority: lead.priority ? `${lead.priority} Lead` : '',
        location: lead.location || '',
        schoolName: lead.school_name || '',
        contactPerson: lead.contact_person || '',
        decisionMaker: lead.contact_person || '',
        mobile: lead.contact_mobile || '',
        followUpOn: lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
        schoolStrength: lead.strength || 0,
        status: lead.status || '',
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Leads_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  exportLeads,
};

