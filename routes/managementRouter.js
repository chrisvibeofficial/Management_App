const { register, verify, login, registerTeacher, registerStudent, forgotPassword, resetPassword, changePassword, getTeachers, getTeacherAndAssignedStudents, makeTeacherAdmin, removeTeacherAsAdmin, deleteTeacher, getStudents, getStudentByStack, deleteStudent, updateStudent, updateTeacher } = require('../controllers/managementController');
const { superAdminAuth } = require('../middlewares/authorization');

const router = require('express').Router();

router.post('/register-management', register);
router.get('/verify-management/:token', verify);
router.post('/login-management', login);
router.post('/forgot-management-password', forgotPassword);
router.post('/reset-management-password/:token', resetPassword);
router.post('/change-management-password/:managementId', changePassword);
router.post('/register-teacher', superAdminAuth, registerTeacher);
router.get('/allTeachers', superAdminAuth, getTeachers);
router.get('/teacher-students/:teacherStack', superAdminAuth, getTeacherAndAssignedStudents);
router.post('/make-admin/:teacherId', superAdminAuth, makeTeacherAdmin);
router.post('/remove-admin/:teacherId', superAdminAuth, removeTeacherAsAdmin);
router.delete('/delete-teacher/:managementId/:teacherId', superAdminAuth, deleteTeacher);
router.put('/update-teacher/:teacherId', superAdminAuth, updateTeacher)
router.post('/register-student', superAdminAuth, registerStudent);
router.get('/allStudents', superAdminAuth, getStudents);
router.post('/student/:studentId', superAdminAuth, getStudentByStack);
router.put('/update-student/:studentId', superAdminAuth, updateStudent);
router.delete('/delete-student/:managementId/:studentId', superAdminAuth, deleteStudent);

module.exports = router;