const ContactQuery = require('../models/ContactQuery');
const ExcelJS = require('exceljs');

// @desc    Get all contact queries
// @route   GET /api/contact-queries
// @access  Private
const getContactQueries = async (req, res) => {
  try {
    const { zone, employee, schoolName, schoolCode, contactMobile, fromDate, toDate } = req.query;
    const filter = {};

    if (zone) filter.zone = { $regex: zone, $options: 'i' };
    if (employee) filter.executive = employee;
    if (schoolName) filter.school_name = { $regex: schoolName, $options: 'i' };
    if (schoolCode) filter.school_code = { $regex: schoolCode, $options: 'i' };
    if (contactMobile) filter.contact_mobile = { $regex: contactMobile, $options: 'i' };

    if (fromDate || toDate) {
      filter.enquiry_date = {};
      if (fromDate) filter.enquiry_date.$gte = new Date(fromDate);
      if (toDate) filter.enquiry_date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const queries = await ContactQuery.find(filter)
      .populate('executive', 'name email')
      .populate('createdBy', 'name email')
      .populate('resolved_by', 'name email')
      .sort({ enquiry_date: -1 });

    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single contact query
// @route   GET /api/contact-queries/:id
// @access  Private
const getContactQuery = async (req, res) => {
  try {
    const query = await ContactQuery.findById(req.params.id)
      .populate('executive', 'name email')
      .populate('createdBy', 'name email')
      .populate('resolved_by', 'name email');

    if (!query) {
      return res.status(404).json({ message: 'Contact query not found' });
    }

    res.json(query);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create contact query
// @route   POST /api/contact-queries/create
// @access  Private
const createContactQuery = async (req, res) => {
  try {
    const query = await ContactQuery.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedQuery = await ContactQuery.findById(query._id)
      .populate('executive', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedQuery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update contact query
// @route   PUT /api/contact-queries/:id
// @access  Private
const updateContactQuery = async (req, res) => {
  try {
    const query = await ContactQuery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('executive', 'name email')
      .populate('createdBy', 'name email')
      .populate('resolved_by', 'name email');

    if (!query) {
      return res.status(404).json({ message: 'Contact query not found' });
    }

    res.json(query);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete contact query
// @route   DELETE /api/contact-queries/:id
// @access  Private
const deleteContactQuery = async (req, res) => {
  try {
    const query = await ContactQuery.findByIdAndDelete(req.params.id);

    if (!query) {
      return res.status(404).json({ message: 'Contact query not found' });
    }

    res.json({ message: 'Contact query deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export contact queries to Excel
// @route   GET /api/contact-queries/export
// @access  Private
const exportContactQueries = async (req, res) => {
  try {
    const { zone, employee, schoolName, schoolCode, contactMobile, fromDate, toDate } = req.query;
    const filter = {};

    if (zone) filter.zone = { $regex: zone, $options: 'i' };
    if (employee) filter.executive = employee;
    if (schoolName) filter.school_name = { $regex: schoolName, $options: 'i' };
    if (schoolCode) filter.school_code = { $regex: schoolCode, $options: 'i' };
    if (contactMobile) filter.contact_mobile = { $regex: contactMobile, $options: 'i' };

    if (fromDate || toDate) {
      filter.enquiry_date = {};
      if (fromDate) filter.enquiry_date.$gte = new Date(fromDate);
      if (toDate) filter.enquiry_date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const queries = await ContactQuery.find(filter)
      .populate('executive', 'name email')
      .populate('createdBy', 'name email')
      .sort({ enquiry_date: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contact Queries');

    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'School Code', key: 'schoolCode', width: 15 },
      { header: 'School Type', key: 'schoolType', width: 15 },
      { header: 'School Name', key: 'schoolName', width: 30 },
      { header: 'Zone', key: 'zone', width: 15 },
      { header: 'Executive', key: 'executive', width: 25 },
      { header: 'Town', key: 'town', width: 30 },
      { header: 'Subject', key: 'subject', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Date of Enquiry', key: 'enquiryDate', width: 20 },
    ];

    queries.forEach((query, index) => {
      worksheet.addRow({
        sno: index + 1,
        schoolCode: query.school_code || '',
        schoolType: query.school_type || 'Existing',
        schoolName: query.school_name || '',
        zone: query.zone || '',
        executive: query.executive?.name || 'Not Assigned',
        town: query.town || '',
        subject: query.subject || '',
        description: query.description || '',
        enquiryDate: query.enquiry_date ? new Date(query.enquiry_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Contact_Queries_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getContactQueries,
  getContactQuery,
  createContactQuery,
  updateContactQuery,
  deleteContactQuery,
  exportContactQueries,
};

