const { register, verify, login, registerTeacher, registerStudent, forgotPassword, resetPassword, changePassword, getTeachers, getTeacherAndAssignedStudents, makeTeacherAdmin, removeTeacherAsAdmin, deleteTeacher, getStudents } = require('../controllers/managementController');
const { authorizeManagement } = require('../middlewares/authorization');

const router = require('express').Router();

router.post('/register', register);
router.get('/verify-account', verify);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', changePassword);
router.post('/register-teacher', authorizeManagement, registerTeacher);
router.get('/allTeachers', authorizeManagement, getTeachers);
router.get('/teacher-students/:teacherStack', authorizeManagement, getTeacherAndAssignedStudents);
router.post('/make-admin/:teacherId', authorizeManagement, makeTeacherAdmin);
router.post('/remove-admin/:teacherId', authorizeManagement, removeTeacherAsAdmin);
router.delete('/delete-teacher', authorizeManagement, deleteTeacher);
router.post('/register-student', authorizeManagement, registerStudent);
router.get('/allStudents', authorizeManagement, getStudents);

module.exports = router;