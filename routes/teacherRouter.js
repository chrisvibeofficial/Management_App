const{register, verify}=require('../controllers/teacherController')
const router = require('express').Router();


router.get('/verify-account', verify);

module.exports=router