const studentModel = require('../models/student');
const scoreModel = require('../models/score');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verify_account, reset_password } = require('../helper/account-verification');
const { emailSender } = require('../middlewares/nodemailer');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Please enter your email'
      })
    };

    if (!password) {
      return res.status(400).json({
        message: 'Please enter your password'
      })
    };

    const student = await studentModel.findOne({ email: email.toLowercCase() });

    if (!student) {
      return res.status(404).json({
        message: 'Student does not exist'
      })
    };

    const isCorrectPassword = await bcrypt.compare(password, student.hashedPassword);

    if (!isCorrectPassword) {
      return res.status(400).json({
        message: 'Incorrect password'
      })
    };

    if (student.isVerified === false) {
      const token = jwt.sign({ studentId: student._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
      const link = `${req.protocol}://${req.get('host')}/api/v1/verify-account/${token}`;
      const firstName = student.fullName.split(' ')[0];

      const mailDetails = {
        subject: 'Email Verification',
        email: student.email,
        html: verify_account(link, firstName)
      };

      emailSender(mailDetails);
      return res.status(400).json({
        message: 'Account not verified, Link has been sent to email address'
      })
    };

    const token = jwt.sign({ studentId: student._id }, process.env.JWT_SECRET, { expiresIn: '1day' });

    res.status(200).json({
      message: 'Login Successfull',
      data: student.fullName,
      token
    })
  } catch (error) {
    console.log(error.message);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({
        message: 'Session expired, Please login to continue'
      })
    }
    res.status(500).json({
      message: 'Error Loggin Student In'
    })
  }
};


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
          const { studentId } = jwt.decode(token);

          if (!studentId) {
            return res.status(404).json({
              message: 'StudentId not found'
            })
          };

          const student = await studentModel.findById(studentId);

          if (!student) {
            return res.status(404).json({
              message: 'Student not found'
            })
          };

          if (student.isVerified === true) {
            return res.status(400).json({
              message: 'Student: Account has already been verified'
            })
          }

          const newToken = jwt.sign({ studentId: student._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
          const link = `${req.protocol}://${req.get('host')}/api/v1/verify-account/${newToken}`;
          const firstName = student.fullName.split(' ')[0];

          const mailDetails = {
            subject: 'Resend: Email Verification',
            email: student.email,
            html: verify_account(link, firstName)
          };

          emailSender(mailDetails);

          res.status(200).json({
            message: 'Session expired: Link has been sent to your Email address'
          })
        }
      } else {
        const student = await studentModel.findById(payload.studentId);

        if (!student) {
          return res.status(404).json({
            message: 'Student not found'
          })
        };

        if (student.isVerified === true) {
          return res.status(400).json({
            message: 'Student: Account has already been verified'
          })
        }

        student.isVerified = true;
        await student.save();

        res.status(200).json({
          message: 'Student: Account verified successfully'
        })
      }
    })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Verifying Student'
    })
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const student = await studentModel.findOne({ email: email.toLowercCase() });

    if (!student) {
      return res.status(404).json({
        message: 'Student not found'
      })
    };

    const token = jwt.sign({ studentId: student._id }, process.env.JWT_SECRET, { expiresIn: '1min' });
    const link = `${req.protocol}://${req.get('host')}/api/v1/reset-password/${token}`; //consumed link from frontend
    const firstName = student.fullName.split(' ')[0];

    const mailDetails = {
      subject: 'RESET PASSWORD',
      email: student.email,
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

    const { studentId } = jwt.decode(token);
    const student = await studentModel.findById(studentId);

    if (!student) {
      return res.status(404).json({
        message: 'Student not found'
      })
    };

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Password does not match'
      })
    };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    student.password = hashedPassword;
    await student.save();

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
    const { id } = req.params;
    const { password, newPassword, confirmPassword } = req.body;

    if (!password || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'Input all feild'
      })
    };

    const student = await studentModel.findById(id);

    if (!student) {
      return res.status(404).json({
        message: 'Student not found'
      })
    };

    const isCorrectPassword = await bcrypt.compare(password, student.password);

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
    student.password = hashedPassword;
    await student.save();

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


exports.getScores = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await studentModel.findById(id);

    if (!student) {
      return res.status(404).json({
        message: 'Student not found'
      })
    };

    const studentScores = await scoreModel.find({ studentId: id });

    if (studentScores.length === 0) {
      return res.status(404).json({
        message: `Scores for ${student.fullName} not found`
      })
    }

    res.status(200).json({
      message: `Total scores for ${student.fullName} listed below`,
      data: studentScores
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      message: 'Error Getting Student Scores'
    })
  }
};


exports.getScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { week } = req.body;

    const student = await studentModel.findById(id);

    if (!student) {
      return res.status(404).json({
        message: 'Student not found'
      })
    };

    const studentScore = await scoreModel.findOne({ studentId: id }, { week: week });

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