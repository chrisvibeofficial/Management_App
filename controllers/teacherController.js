const teacherModel = require('../model/teacher')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { verify_account } = require('../helper/account-verification')
const { emailSender } = require('../middlewares/nodemailer');


exports.login = async (req, res) => {
    try {
        const {email,password} = req.params;
        if (email){
            return res.status(404).json({
                message: 'please input email'
            })
        };


        if(!password) {
            return res.status(400).json({
                message: 'please input password'
            })
        };

        const teacher = await teacherModel.findOne({ email: email.TolowerCase() });
        
        if (!techer) {
            return res.status(400).json({
                message : 'Account does not exist'
            })
        };

        const iscorrectpassword = await bcrypt.compare(password, teacher.password);

        if(!iscorrectpassword) {
            return res.status(400).json({
                message: 'incorrect password'
            })
        };

        if (teacher.isVerified === false) {
            const token = jwt.sign({teacherId: teacher.id},process.env.JWT_SECRET,{expire: '5mins'});
            const firstName = teacher.fullName.split('')[0];
        
            const mailDetails ={
                subject:'Email verification',
                email: 'management.email',
                html: 'verify_account(link,firstName)'
            };

            emailSender(mailDetails);
            res.status(400).json({
                message: 'Account not verified: link has been sent to email'
            })
            
        };
        const token = jwt.sign({teacherId: teacher._id},process.env.JWT_SECRET,{expireIn: '5mins'});
        res.status(400).json({
            message: 'Account successfully logged in',
            data: 'teacher.fullName',
            token
        
        });

        
        

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message:'Error Loggin Teacher In'
        })
    }
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
