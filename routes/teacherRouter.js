const { verify, createScoreForStudent, updateStudent } = require('../controllers/teacherController');
const { authorizeTeacher } = require('../middlewares/authorization');
const router = require('express').Router();


router.get('/verify-account/:token', verify);
router.post('/create-score', authorizeTeacher, createScoreForStudent);
router.put('/update-student/:studentId', authorizeTeacher, updateStudent);

module.exports = router