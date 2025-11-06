const express = require('express');
const router = express.Router();
const {
  getWarehouse,
  getWarehouseItem,
  createWarehouseItem,
  updateWarehouseItem,
  updateStock,
  getWarehouseReports,
} = require('../controllers/warehouseController');
const {
  getWarehouseDCList,
  getWarehouseDC,
  updateWarehouseDC,
  toggleHoldDC,
  getHoldDCList,
} = require('../controllers/warehouseDcController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Warehouse DC routes (must come before /:id routes)
router.get('/dc/list', authMiddleware, getWarehouseDCList);
router.get('/hold-dc/list', authMiddleware, getHoldDCList);
router.get('/dc/:id', authMiddleware, getWarehouseDC);
router.put('/dc/:id', authMiddleware, updateWarehouseDC);
router.post('/dc/:id/hold', authMiddleware, toggleHoldDC);

// Warehouse items routes
router.get('/reports', authMiddleware, getWarehouseReports);
router.post('/stock', authMiddleware, updateStock);
router.get('/', authMiddleware, getWarehouse);
router.post('/', authMiddleware, createWarehouseItem);
router.get('/:id', authMiddleware, getWarehouseItem);
router.put('/:id', authMiddleware, updateWarehouseItem);

module.exports = router;

