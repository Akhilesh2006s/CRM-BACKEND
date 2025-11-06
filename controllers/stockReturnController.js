const StockReturn = require('../models/StockReturn');
const Lead = require('../models/Lead');

async function getNextReturnNumber(userId) {
  const latest = await StockReturn.find({ createdBy: userId }).sort({ returnNumber: -1 }).limit(1);
  const latestNum = latest.length > 0 ? latest[0].returnNumber : 0;
  return latestNum + 1;
}

// Executive create
const createExecutiveReturn = async (req, res) => {
  try {
    const { leadId, returnDate, remarks, lrNumber, finYear, schoolType, schoolCode, lineItems } = req.body;
    if (!leadId || !returnDate) return res.status(400).json({ message: 'leadId and returnDate are required' });

    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const returnNumber = await getNextReturnNumber(req.user._id);
    const doc = await StockReturn.create({
      returnNumber,
      returnDate,
      sourceType: 'Executive',
      createdBy: req.user._id,
      leadId,
      remarks: remarks || '',
      lrNumber: lrNumber || '',
      finYear: finYear || '',
      schoolType: schoolType || '',
      schoolCode: schoolCode || '',
      lineItems: Array.isArray(lineItems) ? lineItems : [],
      status: 'Submitted',
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Executive lists
const listExecutiveReturns = async (req, res) => {
  try {
    const items = await StockReturn.find({ sourceType: 'Executive' })
      .populate('createdBy', 'name email')
      .populate('leadId', 'school_name contact_person location')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listMyExecutiveReturns = async (req, res) => {
  try {
    const items = await StockReturn.find({ sourceType: 'Executive', createdBy: req.user._id })
      .populate('leadId', 'school_name contact_person location')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Warehouse create
const createWarehouseReturn = async (req, res) => {
  try {
    const { returnDate, remarks, lrNumber, finYear, lineItems } = req.body;
    if (!returnDate) return res.status(400).json({ message: 'returnDate is required' });

    const returnNumber = await getNextReturnNumber(req.user._id);
    const doc = await StockReturn.create({
      returnNumber,
      returnDate,
      sourceType: 'Warehouse',
      createdBy: req.user._id,
      remarks: remarks || '',
      lrNumber: lrNumber || '',
      finYear: finYear || '',
      lineItems: Array.isArray(lineItems) ? lineItems : [],
      status: 'Submitted',
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listWarehouseReturns = async (req, res) => {
  try {
    const items = await StockReturn.find({ sourceType: 'Warehouse' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createExecutiveReturn,
  listExecutiveReturns,
  listMyExecutiveReturns,
  createWarehouseReturn,
  listWarehouseReturns,
};


