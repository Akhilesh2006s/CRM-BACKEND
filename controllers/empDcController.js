const EmpDC = require('../models/EmpDC');

const create = async (req, res) => {
  try {
    const payload = { ...req.body, created_by: req.user._id };
    const item = await EmpDC.create(payload);
    const populated = await EmpDC.findById(item._id).populate('employee_id', 'name email');
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const list = async (req, res) => {
  try {
    const items = await EmpDC.find({}).populate('employee_id', 'name email').sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getOne = async (req, res) => {
  try {
    const item = await EmpDC.findById(req.params.id).populate('employee_id', 'name email');
    if (!item) return res.status(404).json({ message: 'EMP DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const markReturned = async (req, res) => {
  try {
    const item = await EmpDC.findByIdAndUpdate(
      req.params.id,
      { status: 'returned' },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'EMP DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { create, list, getOne, markReturned };






