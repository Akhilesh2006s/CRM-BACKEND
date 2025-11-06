const Sale = require('../models/Sale');
const DC = require('../models/DC');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
  try {
    const { status, assignedTo, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(filter)
      .populate('leadId')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dcId')
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('leadId')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dcId')
      .populate('poSubmittedBy', 'name email');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create sale
// @route   POST /api/sales/create
// @access  Private
const createSale = async (req, res) => {
  try {
    const { quantity, unitPrice } = req.body;
    const totalAmount = quantity * unitPrice;

    const sale = await Sale.create({
      ...req.body,
      totalAmount,
      createdBy: req.user._id,
    });

    // Auto-create DC entry for this sale
    const dc = await DC.create({
      saleId: sale._id,
      employeeId: sale.assignedTo,
      customerName: sale.customerName,
      customerEmail: sale.customerEmail,
      customerAddress: req.body.customerAddress || req.body.address || 'N/A',
      customerPhone: sale.customerPhone,
      product: sale.product,
      requestedQuantity: sale.quantity,
      deliverableQuantity: 0,
      status: 'created',
      createdBy: req.user._id,
    });

    // Link DC to sale
    sale.dcId = dc._id;
    await sale.save();

    const populatedSale = await Sale.findById(sale._id)
      .populate('leadId')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dcId');

    res.status(201).json(populatedSale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private
const updateSale = async (req, res) => {
  try {
    const { quantity, unitPrice } = req.body;
    if (quantity && unitPrice) {
      req.body.totalAmount = quantity * unitPrice;
    }

    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('leadId')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dcId')
      .populate('poSubmittedBy', 'name email');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit Purchase Order for a sale
// @route   POST /api/sales/:id/submit-po
// @access  Private
const submitPO = async (req, res) => {
  try {
    const { poDocument } = req.body;

    if (!poDocument) {
      return res.status(400).json({ message: 'PO document is required' });
    }

    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      {
        poDocument,
        poSubmittedAt: new Date(),
        poSubmittedBy: req.user._id,
        status: 'Closed', // Move sale to Closed status
      },
      { new: true, runValidators: true }
    )
      .populate('leadId')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dcId')
      .populate('poSubmittedBy', 'name email');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Update DC with PO document
    if (sale.dcId) {
      await DC.findByIdAndUpdate(sale.dcId, {
        poDocument,
      });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get closed sales (for DC raising)
// @route   GET /api/sales/closed
// @access  Private
const getClosedSales = async (req, res) => {
  try {
    const { assignedTo } = req.query;
    const filter = { status: 'Closed' };

    if (assignedTo) filter.assignedTo = assignedTo;

    const sales = await Sale.find(filter)
      .populate('leadId')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('dcId')
      .populate('poSubmittedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSales,
  getSale,
  createSale,
  updateSale,
  submitPO,
  getClosedSales,
};

