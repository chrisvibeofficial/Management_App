const{register, verify, createScoreForStudent}=require('../controllers/teacherController');
const { authorizeTeacher } = require('../middlewares/authorization');
const router = require('express').Router();


router.get('/verify-account', verify);
router.post('/create-score', authorizeTeacher, createScoreForStudent);

module.exports=router