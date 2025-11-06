const Leave = require('../models/Leave');

// @desc    Get all leaves
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create leave request
// @route   POST /api/leaves/create
// @access  Private
const createLeave = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

    const leave = await Leave.create({
      ...req.body,
      employeeId: req.user._id,
      days,
    });

    const populatedLeave = await Leave.findById(leave._id)
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email');

    res.status(201).json(populatedLeave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject leave
// @route   PUT /api/leaves/:id/approve
// @access  Private
const approveLeave = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const updateData = {
      status,
      approvedBy: req.user._id,
      approvedAt: new Date(),
    };

    if (status === 'Rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email');

    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeaves,
  createLeave,
  approveLeave,
};

