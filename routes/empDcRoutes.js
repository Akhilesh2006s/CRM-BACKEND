const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/empDcController');

router.post('/create', authMiddleware, ctrl.create);
router.get('/list', authMiddleware, ctrl.list);
router.get('/:id', authMiddleware, ctrl.getOne);
router.put('/:id/return', authMiddleware, ctrl.markReturned);

module.exports = router;






