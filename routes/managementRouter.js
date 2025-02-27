const { register, verify, login, registerTeacher, registerStudent, forgotPassword, resetPassword, changePassword, getTeachers, getTeacherAndAssignedStudents, makeTeacherAdmin, removeTeacherAsAdmin, deleteTeacher, getStudents, getStudentByStack, deleteStudent, updateStudent, updateTeacher } = require('../controllers/managementController');
const { authorizeManagement } = require('../middlewares/authorization');

const router = require('express').Router();

router.post('/register', register);
router.get('/verify-management/:token', verify);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', changePassword);
router.post('/register-teacher', authorizeManagement, registerTeacher);
router.get('/allTeachers', authorizeManagement, getTeachers);
router.get('/teacher-students/:teacherStack', authorizeManagement, getTeacherAndAssignedStudents);
router.post('/make-admin/:teacherId', authorizeManagement, makeTeacherAdmin);
router.post('/remove-admin/:teacherId', authorizeManagement, removeTeacherAsAdmin);
router.delete('/delete-teacher/:managementId/:teacherId', authorizeManagement, deleteTeacher);
router.put('/update-teacher/:teacherId', authorizeManagement, updateTeacher)
router.post('/register-student', authorizeManagement, registerStudent);
router.get('/allStudents', authorizeManagement, getStudents);
router.post('/student/:studentId', authorizeManagement, getStudentByStack);
router.put('/update-student/:studentId', authorizeManagement, updateStudent);
router.delete('/delete-student/:managementId/:studentId', authorizeManagement, deleteStudent);

module.exports = router;