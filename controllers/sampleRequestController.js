const SampleRequest = require('../models/SampleRequest');
const EmpDC = require('../models/EmpDC');
const User = require('../models/User');

// @desc    Create sample request (by Employee)
// @route   POST /api/sample-requests
// @access  Private (Employee only)
const createSampleRequest = async (req, res) => {
  try {
    const { products, purpose } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'At least one product is required' });
    }

    // Validate products
    for (const product of products) {
      if (!product.product_name || !product.quantity || product.quantity < 1) {
        return res.status(400).json({ message: 'Each product must have a name and quantity >= 1' });
      }
    }

    const sampleRequest = await SampleRequest.create({
      employee_id: req.user._id,
      products,
      purpose: purpose || 'To show schools',
      status: 'Pending',
    });

    const populated = await SampleRequest.findById(sampleRequest._id)
      .populate('employee_id', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sample requests (for Employee - their own requests)
// @route   GET /api/sample-requests/my
// @access  Private (Employee only)
const getMySampleRequests = async (req, res) => {
  try {
    const requests = await SampleRequest.find({ employee_id: req.user._id })
      .populate('employee_id', 'name email')
      .populate('accepted_by', 'name email')
      .populate('rejected_by', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending sample requests (for Employee DC page - to accept/reject)
// @route   GET /api/sample-requests/pending
// @access  Private
const getPendingSampleRequests = async (req, res) => {
  try {
    const requests = await SampleRequest.find({ status: 'Pending' })
      .populate('employee_id', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept sample request (creates EmpDC)
// @route   PUT /api/sample-requests/:id/accept
// @access  Private
const acceptSampleRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const sampleRequest = await SampleRequest.findById(id);
    if (!sampleRequest) {
      return res.status(404).json({ message: 'Sample request not found' });
    }

    if (sampleRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'Sample request is not pending' });
    }

    // Create EmpDC entry
    const empDC = await EmpDC.create({
      emp_dc_code: `SAMPLE-${Date.now().toString().slice(-6)}`,
      employee_id: sampleRequest.employee_id,
      kit_type: 'Sales',
      distribution_date: new Date(),
      products: sampleRequest.products.map(p => ({
        product: p.product_name,
        quantity: p.quantity,
      })),
      status: 'active',
      created_by: req.user._id,
    });

    // Update sample request
    sampleRequest.status = 'Accepted';
    sampleRequest.accepted_at = new Date();
    sampleRequest.accepted_by = req.user._id;
    sampleRequest.emp_dc_id = empDC._id;
    await sampleRequest.save();

    const populated = await SampleRequest.findById(sampleRequest._id)
      .populate('employee_id', 'name email')
      .populate('accepted_by', 'name email')
      .populate('emp_dc_id');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject sample request
// @route   PUT /api/sample-requests/:id/reject
// @access  Private
const rejectSampleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    const sampleRequest = await SampleRequest.findById(id);
    if (!sampleRequest) {
      return res.status(404).json({ message: 'Sample request not found' });
    }

    if (sampleRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'Sample request is not pending' });
    }

    sampleRequest.status = 'Rejected';
    sampleRequest.rejected_at = new Date();
    sampleRequest.rejected_by = req.user._id;
    if (rejection_reason) {
      sampleRequest.rejection_reason = rejection_reason;
    }
    await sampleRequest.save();

    const populated = await SampleRequest.findById(sampleRequest._id)
      .populate('employee_id', 'name email')
      .populate('rejected_by', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get accepted sample requests (for Admin Employee DC view)
// @route   GET /api/sample-requests/accepted
// @access  Private (Admin only)
const getAcceptedSampleRequests = async (req, res) => {
  try {
    const requests = await SampleRequest.find({ status: 'Accepted' })
      .populate('employee_id', 'name email')
      .populate('accepted_by', 'name email')
      .populate('emp_dc_id')
      .sort({ accepted_at: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSampleRequest,
  getMySampleRequests,
  getPendingSampleRequests,
  acceptSampleRequest,
  rejectSampleRequest,
  getAcceptedSampleRequests,
};




