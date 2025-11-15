const Training = require('../models/Training');

// @desc    Get all trainings with filters
// @route   GET /api/training
// @access  Private
const getTrainings = async (req, res) => {
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
      filter.trainingDate = {};
      if (fromDate) filter.trainingDate.$gte = new Date(fromDate);
      if (toDate) filter.trainingDate.$lte = new Date(toDate);
    }

    const trainings = await Training.find(filter)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ trainingDate: -1 });

    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single training
// @route   GET /api/training/:id
// @access  Private
const getTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create training
// @route   POST /api/training/create
// @access  Private
const createTraining = async (req, res) => {
  try {
    // Prepare training data - only include schoolCode if it's provided and not empty
    const trainingData = {
      ...req.body,
      createdBy: req.user._id,
    };
    
    // Remove schoolCode if it's an empty string
    if (trainingData.schoolCode === '' || trainingData.schoolCode === null || trainingData.schoolCode === undefined) {
      delete trainingData.schoolCode;
    }
    
    const training = await Training.create(trainingData);

    const populatedTraining = await Training.findById(training._id)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTraining);
  } catch (error) {
    console.error('Error creating training:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update training
// @route   PUT /api/training/:id
// @access  Private
const updateTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel training
// @route   PUT /api/training/:id/cancel
// @access  Private
const cancelTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    )
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email');

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get training statistics
// @route   GET /api/training/stats
// @access  Private
const getTrainingStats = async (req, res) => {
  try {
    const { fromDate, toDate, zone } = req.query;
    const matchFilter = {};
    
    if (fromDate || toDate) {
      matchFilter.trainingDate = {};
      if (fromDate) matchFilter.trainingDate.$gte = new Date(fromDate);
      if (toDate) matchFilter.trainingDate.$lte = new Date(toDate);
    }
    if (zone) matchFilter.zone = zone;

    const stats = await Training.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Training.countDocuments(matchFilter);
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
    const zoneStats = await Training.aggregate([
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
    const subjectStats = await Training.aggregate([
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
  getTrainings,
  getTraining,
  createTraining,
  updateTraining,
  cancelTraining,
  getTrainingStats,
};

