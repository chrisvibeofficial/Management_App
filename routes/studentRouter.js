const { login, forgotPassword, resetPassword, getScores, changePassword, verify, getScoreByWeek } = require('../controllers/studentController');

const router = require('express').Router();

router.post('/login-student', login);
router.get('/verify-student/:token', verify)
router.post('/forgot-student-password', forgotPassword);
router.post('/reset-student-password/:token', resetPassword);
router.post('/change-student-password/:studentId', changePassword);
router.get('/get-scores', getScores);
router.get('/get-score/:id', getScoreByWeek);

module.exports = router;