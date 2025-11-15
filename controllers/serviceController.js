const Service = require('../models/Service');

// @desc    Get all services with filters
// @route   GET /api/services
// @access  Private
const getServices = async (req, res) => {
  try {
    const { status, trainerId, employeeId, zone, schoolCode, schoolName, fromDate, toDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (trainerId) filter.trainerId = trainerId;
    if (employeeId) filter.employeeId = employeeId;
    if (zone) filter.zone = zone;
    if (schoolCode) filter.schoolCode = { $regex: schoolCode, $options: 'i' };
    if (schoolName) filter.schoolName = { $regex: schoolName, $options: 'i' };
    if (fromDate || toDate) {
      filter.serviceDate = {};
      if (fromDate) filter.serviceDate.$gte = new Date(fromDate);
      if (toDate) filter.serviceDate.$lte = new Date(toDate);
    }

    const services = await Service.find(filter)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ serviceDate: -1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Private
const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create service
// @route   POST /api/services/create
// @access  Private
const createService = async (req, res) => {
  try {
    // Prepare service data - only include schoolCode if it's provided and not empty
    const serviceData = {
      ...req.body,
      createdBy: req.user._id,
    };
    
    // Remove schoolCode if it's an empty string
    if (serviceData.schoolCode === '' || serviceData.schoolCode === null || serviceData.schoolCode === undefined) {
      delete serviceData.schoolCode;
    }
    
    const service = await Service.create(serviceData);

    const populatedService = await Service.findById(service._id)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedService);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel service
// @route   PUT /api/services/:id/cancel
// @access  Private
const cancelService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    )
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get service statistics
// @route   GET /api/services/stats
// @access  Private
const getServiceStats = async (req, res) => {
  try {
    const { fromDate, toDate, zone } = req.query;
    const matchFilter = {};
    
    if (fromDate || toDate) {
      matchFilter.serviceDate = {};
      if (fromDate) matchFilter.serviceDate.$gte = new Date(fromDate);
      if (toDate) matchFilter.serviceDate.$lte = new Date(toDate);
    }
    if (zone) matchFilter.zone = zone;

    const stats = await Service.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Service.countDocuments(matchFilter);
    const byStatus = {
      Scheduled: 0,
      Completed: 0,
      Cancelled: 0,
    };

    stats.forEach((stat) => {
      if (stat._id && byStatus.hasOwnProperty(stat._id)) {
        byStatus[stat._id] = stat.count;
      }
    });

    // Zone-wise distribution
    const zoneStats = await Service.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$zone',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Subject-wise distribution
    const subjectStats = await Service.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$subject',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      total,
      byStatus,
      zoneStats,
      subjectStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  cancelService,
  getServiceStats,
};




