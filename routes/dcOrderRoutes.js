const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/dcOrderController');

router.get('/', authMiddleware, ctrl.list);
router.get('/:id', authMiddleware, ctrl.getOne);
router.get('/:id/history', authMiddleware, ctrl.getHistory);
router.post('/create', authMiddleware, ctrl.create);
router.put('/:id', authMiddleware, ctrl.update);
router.put('/:id/submit', authMiddleware, ctrl.submit);
router.put('/:id/mark-in-transit', authMiddleware, ctrl.markInTransit);
router.put('/:id/complete', authMiddleware, ctrl.complete);
router.put('/:id/hold', authMiddleware, ctrl.hold);

module.exports = router;






