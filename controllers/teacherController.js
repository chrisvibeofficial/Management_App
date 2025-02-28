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
                    const link = `${req.protocol}://${req.get('host')}/api/v1/verify-teacher/${newToken}`;
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
        };

        const teacher = await teacherModel.findOne({ email: email.toLowerCase() });

        if (!teacher) {
            return res.status(404).json({
                message: 'Account dose not exist'
            })
        };

        const isCorrectPassword = await bcrypt.compare(password, teacher.password);

        if (!isCorrectPassword) {
            return res.status(400).json({
                message: 'incorrect password'
            })
        };
        if (teacher.isVerified === false) {
            const token = jwt.sign({ teacherId: teacher._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
            const link = `${req.protocol}://${req.get('host')}/api/v1/verify-teacher/${token}`;
            const firstName = teacher.fullName.split(' ')[0];

            const mailDetails = {
                subject: 'Email Verification',
                email: teacher.email,
                html: verify_account(link, firstName)
            };

            emailSender(mailDetails);
            res.status(400).json({
                message: 'Account not verified: link has been send to your email '
            })

        };

        const token = jwt.sign({ teacherId: teacher._id }, process.env.JWT_SECRET, { expiresIn: '1day' });
        res.status(200).json({
            message: 'Account Successfully Logger In',
            data: teacher.fullName,
            token
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: 'Error Logging Teacher In'
        })
    }
};


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const teacher = await teacherModel.findOne({ email: email.toLowercCase() });

        if (!teacher) {
            return res.status(404).json({
                message: 'Teacher not found'
            })
        };

        const token = jwt.sign({ teacherId: teacher._id }, process.env.JWT_SECRET, { expiresIn: '1min' });
        const link = `${req.protocol}://${req.get('host')}/api/v1/reset-password/${token}`; //consumed link from frontend
        const firstName = teacher.fullName.split(' ')[0];

        const mailDetails = {
            subject: 'RESET PASSWORD',
            email: teacher.email,
            html: reset_password(link, firstName)
        };

        emailSender(mailDetails);
        res.status(200).json({
            message: 'Link has been sent to email'
        })
    } catch (error) {
        console.log(error.message);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({
                message: 'Session expired, Please login to continue'
            })
        }
        res.status(500).json({
            message: 'Error: Cannot forget pasword'
        })
    }
};


exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (!token) {
            return res.status(404).json({
                message: 'token not found'
            })
        };

        const { teacherId } = jwt.decode(token);
        const teacher = await teacherModel.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({
                message: 'Teacher not found'
            })
        };

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: 'Password does not match'
            })
        };

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        teacher.password = hashedPassword;
        await teacher.save();

        res.status(200).json({
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.log(error.message);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({
                message: 'Session expired, Please login to continue'
            })
        }
        res.status(500).json({
            message: 'Error: Cannot forget password'
        })
    }
};


exports.changePassword = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { password, newPassword, confirmPassword } = req.body;

        if (!password || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: 'Input all feild'
            })
        };

        const teacher = await teacherModel.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({
                message: 'Teacher not found'
            })
        };

        const isCorrectPassword = await bcrypt.compare(password, teacher.password);

        if (!isCorrectPassword) {
            return res.status(400).json({
                message: 'incorrect password'
            })
        };

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: 'Password does not match'
            })
        };

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        teacher.password = hashedPassword;
        await teacher.save();

        res.status(200).json({
            message: 'Password changed successfully'
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: 'Error Changing Password'
        })
    }
}


exports.createScoreForStudent = async (req, res) => {
    try {
        const { teacherId, studentId } = req.params;
        const { punctuality, attendance, assignment, classAccessment, personalDefense } = req.body;

        if (!punctuality || !attendance || !assignment || !classAccessment || !personalDefense) {
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

        const previousScore = await scoreModel.find({ studentId: studentId });
        const totalScore = punctuality + attendance + assignment + classAccessment + personalDefense;

        const newScore = new scoreModel({
            week: previousScore.length + 1,
            punctuality,
            attendance,
            assignment,
            classAccessment,
            personalDefense,
            totalScore: totalScore,
            averageScore: (totalScore / 5) + '%',
            studentName: student.fullName,
            studentId: student._id
        });

        await newScore.save();
        student.scoreId.push(newScore._id);
        await student.save();

        res.status(201).json({
            message: 'Student Score',
            data: newScore
        })

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: 'Error Creating Score for Student'
        })
    }
};


exports.getAllAssigned = async (req, res) => {
    try {
        const { teacherId } = req.body;
        const teacher = await teacherModel.findById(teacherId);
        const students = await studentModel.find({ stack: teacher.stack });

        if (!teacher) {
            return res.status(404).json({
                message: 'Teacher not found'
            })
        };

        if (students.length === 0) {
            return res.status(404).json({
                message: 'No Student Found'
            })
        };

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: 'Error Getting Assigned Student'
        })
    }
}


exports.getStudentScores = async (req, res) => {
    try {
      const { teacherId,studentId } = req.params;
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
          message: 'Cannot check score, Student is not assigned to teacher'
        })
      };
  
      const studentScores = await scoreModel.find({ studentId: student._id });
  
      if (studentScores.length === 0) {
        return res.status(404).json({
          message: `Scores for ${student.fullName} not found`
        })
      }
  
      res.status(200).json({
        message: `All scores for ${student.fullName} listed below`,
        data: studentScores
      })
    } catch (error) {
      console.log(error.message)
      res.status(500).json({
        message: 'Error Getting Student Scores'
      })
    }
  };
  
  
  exports.getStudentScoreByWeek = async (req, res) => {
    try {
      const {teacherId, studentId } = req.params;
      const { week } = req.body;
  
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
  
      const studentScore = await scoreModel.findOne({ studentId: studentId } && { week: week });
  
      if (!studentScore) {
        return res.status(404).json({
          message: `${student.fullName} score for week: ${week} not found`
        })
      };
  
      res.status(200).json({
        message: `${student.fullName} score for week: ${week}`,
        data: studentScore
      })
    } catch (error) {
      console.log(error.message)
      res.status(500).json({
        message: 'Error Getting Student Score'
      })
    }
  };