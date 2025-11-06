const Lead = require('../models/Lead');

// @desc    Get all schools (from leads)
// @route   GET /api/schools
// @access  Private
const getSchools = async (req, res) => {
  try {
    // Get unique schools from leads
    const leads = await Lead.find({})
      .select('school_name school_code contact_person contact_mobile location strength')
      .sort({ school_name: 1 });

    // Transform to school format
    const schools = leads.map(lead => ({
      _id: lead._id,
      schoolCode: lead.school_code || '',
      schoolName: lead.school_name || '',
      contactName: lead.contact_person || '',
      mobileNumber: lead.contact_mobile || '',
      location: lead.location || '',
      avgStrength: lead.strength || 0,
    }));

    // Remove duplicates by school name
    const uniqueSchools = Array.from(
      new Map(schools.map(s => [s.schoolName, s])).values()
    );

    res.json(uniqueSchools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSchools,
};

