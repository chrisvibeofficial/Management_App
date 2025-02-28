const { verify, createScoreForStudent, updateStudent, login, resetPassword, forgotPassword, changePassword, getAllAssigned, getStudentScores, getStudentScoreByWeek } = require('../controllers/teacherController');
const { adminAuth } = require('../middlewares/authorization');
const router = require('express').Router();


router.post('/login-teacher', login)
router.get('/verify-teacher/:token', verify);
router.post('/forgot-teacher-password', forgotPassword);
router.post('/reset-teacher-password/:token', resetPassword);
router.post('/change-teacher-password/:teacherId', changePassword);
router.post('/create-score/:teacherId/:studentId', adminAuth, createScoreForStudent);
router.get('/all-assigned-student/:teacher', getAllAssigned)
router.get('/student-scores', getStudentScores);
router.get('/student-score', getStudentScoreByWeek);

module.exports = router