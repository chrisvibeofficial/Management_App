const { login, forgotPassword, resetPassword, getScores, getScore, changePassword } = require('../controllers/studentController');

const router = require('express').Router();

router.post('/login-student', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', changePassword);
router.get('/get-scores', getScores);
router.get('/get-score', getScore);

module.exports = router;