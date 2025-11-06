const express = require('express');
const router = express.Router();
const { listTrainers, createTrainer, updateTrainer, setTrainerActive, resetTrainerPassword } = require('../controllers/trainerController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, listTrainers);
router.post('/create', authMiddleware, createTrainer);
router.put('/:id', authMiddleware, updateTrainer);
router.put('/:id/active', authMiddleware, setTrainerActive);
router.put('/:id/reset-password', authMiddleware, resetTrainerPassword);

module.exports = router;





