const { verify, createScoreForStudent, updateStudent, login } = require('../controllers/teacherController');
const { authorizeTeacher } = require('../middlewares/authorization');
const router = require('express').Router();


router.get('/verify-teacher/:token', verify);
router.post('/login', login)
router.post('/create-score', authorizeTeacher, createScoreForStudent);
router.put('/update-student/:studentId', authorizeTeacher, updateStudent);

module.exports = router