const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Get active products (public endpoint for use throughout the app)
router.get('/active', productController.getActiveProducts);

// All other routes require authentication
router.use(authMiddleware);

// Get all products (admin only)
router.get('/', roleMiddleware('Admin', 'Super Admin'), productController.list);

// Get single product (admin only)
router.get('/:id', roleMiddleware('Admin', 'Super Admin'), productController.getOne);

// Create product (admin only)
router.post('/', roleMiddleware('Admin', 'Super Admin'), productController.create);

// Update product (admin only)
router.put('/:id', roleMiddleware('Admin', 'Super Admin'), productController.update);

// Delete product (admin only)
router.delete('/:id', roleMiddleware('Admin', 'Super Admin'), productController.remove);

module.exports = router;

