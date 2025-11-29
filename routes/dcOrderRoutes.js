const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/dcOrderController');

router.get('/', authMiddleware, ctrl.list);
router.post('/create', authMiddleware, ctrl.create);
// Specific routes must come before parameterized routes
router.post('/:id/submit-edit', authMiddleware, (req, res, next) => {
  console.log('Route /:id/submit-edit matched for ID:', req.params.id);
  next();
}, ctrl.submitEdit);
router.put('/:id/approve-edit', authMiddleware, ctrl.approveEdit);
router.put('/:id/submit', authMiddleware, ctrl.submit);
router.put('/:id/mark-in-transit', authMiddleware, ctrl.markInTransit);
router.put('/:id/complete', authMiddleware, ctrl.complete);
router.put('/:id/hold', authMiddleware, ctrl.hold);
router.get('/:id/history', authMiddleware, ctrl.getHistory);
router.get('/:id', authMiddleware, ctrl.getOne);
router.put('/:id', authMiddleware, ctrl.update);

module.exports = router;






