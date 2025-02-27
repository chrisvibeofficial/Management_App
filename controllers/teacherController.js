const teacherModel = require('../model/teacher')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { verify_account } = require('../helper/account-verification')
const { emailSender } = require('../middlewares/nodemailer');
const managementModel = require('../models/management');


exports.login = async (req, res) =>{
    try{
        const {email,password} = req.body;

        if(!email) {
            return res.status(400).json({
                message: 'pleas input email'

            })
        };
        if (!password) {
            return res.status(400).json([
                message: 'please input password'
            ])
        };

        const login = await loginModel.findone({email:email.tolowerCase()});

        if (!login){
            return res.status(404)({
                message:'Account does not exist'

            })
        };

        const incorrectPassword = await bycrypt.compare( password,login,password);

       if (!isinCorrectPassword) {
            return res.status(404)({
                message:'incorrect passwords'


    })
};

if(login.isverified === false) {
    const token = jwt.sign({loginId: login._id}, process.envJWT_SECRET,{expireIn:'5min'});
    const link =`${req.protpcol}://${req.get('host')}/api/v1/verify-account/${token}`;
    const firstName = login.fullName.split('')[0];

    const mailDetails = {
        subject: 'Email verification',
        email: login.email,
        html:verify_account(link,firstName)
    };

    emailsender(mailDetails),
    res.status(400).json({
        message: 'Account not verified:link has sent to youremail'

    });
    
}

const  token = jwt.sign({loginId: login._id},process.env,JWT_SECRET,{expireIn:'5mins'});

res.status(200).json({
    message: 'Account successfulylogged In',
    data: login.fullName,
    token
})
    }catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: 'Error logging login'
    
        })
    }


exports.verify = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) {
            return res.status(404).json({
                message: 'Token not found'
            })
        };
        jwt.verify(token, process.env.JWT_SECRET, async (error, payload) => {
            if (error) {
                if (error instanceof jwt.JsonWebTokenError) {
                    const { teacherId } = jwt.decode(token);
                    if (!teacherId) {
                        return res.status(400).json({
                            message: 'teacher not found'
                        })
                    };
                    const teacher = await teacherModel.findById(teacherId);

                    if (teacher.isVerified === true) {
                        return res.status(400).json({
                            message: 'Teacher: Account has already been verified'
                        })
                    }
                    const newToken = jwt.sign({ teacherId: teacher._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
                    const link = `${req.protocol}://${req.get('host')}/api/v1/verify-account/${newToken}`;
                    const firstName = teacher.fullName.split(' ')[0];

                    const mailDetails = {
                        subject: 'Resend: Email Verfication',
                        email: teacher.email,
                        html: verify_account(link, firstName)
                    };
                    emailSender(mailDetails);
                    res.status(200).json({
                        message: 'Section expired: link has been sent to yuor email address '
                    })
                }
            } else {
                const teacher = await teacherModel.findById(payload.teacherId);
                if (!teacher) {
                    return res.status(400).json({
                        message: 'Teacher not found'
                    })
                };
                if (teacher.isVerified === true) {
                    return res.status(400).json({
                        message: 'Teacher:Account has already has been verified'
                    })
                }
                teacher.isVerified = true;
                await teacher.save();

                res.status(200).json({
                    message: 'Teacher:Account Verified successfully'
                })
            }
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message:'Error Verifying Teacher'
        })
        
    }
};
