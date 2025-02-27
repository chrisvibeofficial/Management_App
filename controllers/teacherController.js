const teacherModel = require('../models/teacher');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verify_account } = require('../helper/account-verification');
const { emailSender } = require('../middlewares/nodemailer');
const studentModel = require('../models/student');
const scoreModel = require('../models/score');

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
            message: 'Error Verifying Teacher'
        })

    }
};


exports.createScoreForStudent = async (req, res) => {
    try {
        const { teacherId, studentId } = req.params;
        const { punctuality, attendance, assigment, classAccessment, personalDefense } = req.body;

        if (!punctuality || !attendance || !assigment || !classAccessment || !personalDefense) {
            return res.status(400).json({
                message: 'Please input all field'
            })
        };

        const student = await studentModel.findById(studentId);
        const teacher = await teacherModel.findById(teacherId);

        if (!student) {
            return res.status(404).json({
                message: 'Student not found'
            })
        };

        if (!teacher) {
            return res.status(404).json({
                message: 'Teacher not found'
            })
        };

        if (teacher.stack !== student.stack) {
            return res.status(404).json({
                message: 'You can only create score for assigned student'
            })
        };

        const previousScore = await scoreModel.find({ studentId: id });

        const newScore = new scoreModel({
            week: previousScore.length + 1,
            punctuality,
            attendance,
            assigment,
            classAccessment,
            personalDefense,
            totalScore: punctuality + attendance + assigment + classAccessment + personalDefense,
            averageScore: totalScore / 5,
            studentName: student.fullName,
            studentId: student._id
        });

        await newScore.save();

        res.status(201).json({
            message: `${newScore.studentName} score for week: ${newScore.week}`,
            data: newScore
        })

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: 'Error Creating Score for Student'
        })
    }
}


exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({
          message: 'Please Input email'
        })
  
      };
      if (!password) {
        return res.status(400).json({
          message: 'please input password'
        })
      }
      const teacher = await teacherModel.findOne({ email: email.toLowercCase })
      if (!teacher) {
        res.status(404).json({
          message: 'Account dose not exist'
        })
      };
      const isCorrectPaworrd = await bcrypt.compare(password, teacher.password);
      if (!isCorrectPaworrd) {
        return res.status(400).json({
          message: 'incorrect password'
        })
      };
      if (teacher.isVerified === false) {
        const token = jwt.sign({ teacherId: teacher._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
        const link = `${req.protocol}://${req.get('host')}/api/v1/verify-account/${token}`;
        const firstName = teacher.fullName.split(' ')[0];
        
        const mailDetails={
          subject:'Email Verification',
          email:teacher.email,
          html:verify_account(link, firstName)
        };
  
        emailSender(mailDetails);
        res.status(400).json({
          message:'Account not verified: link has been send to your email '
        })
    
    };
      const token = jwt.sign({teacherId:teacher._id},process.env.JWT_SECRET,{expiresIn:'1day'});
      res.status(200).json({
        message:'Account Successfully Logger In',
        data:teacher.fullName,
        token
      })
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        message:'Error Logging Teacher In' 
      })      
    }
  }