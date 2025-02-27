const { login, forgotPassword, resetPassword, getScores, getScore, changePassword, verify } = require('../controllers/studentController');

const router = require('express').Router();

router.post('/login-student', login);
router.get('/verify-account/:token', verify)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', changePassword);
router.get('/get-scores', getScores);
router.get('/get-score/:id', getScore);

module.exports = router;