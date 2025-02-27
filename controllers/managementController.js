const managementModel = require('../models/management');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { verify_account } = require('../helper/account-verification');
const { emailSender } = require('../middlewares/nodemailer');
const teacherModel = require('../models/teacher');
const studentModel = require('../models/student');


exports.register = async (req, res) => {
  try {
    const { fullName, email, gender, password, confirmPassword } = req.body;

    if (!fullName || !email || !gender || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Please input all field'
      })
    };

    const existingManagement = await managementModel.findOne({ email: email.toLowerCase() });

    if (existingManagement) {
      return res.status(400).json({
        message: `Account with ${email} already exist`
      })
    };

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Password does not match'
      })
    }

    const saltedRound = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltedRound);

    const management = new managementModel({
      fullName,
      email,
      gender,
      password: hashedPassword,
      isSuperAdmin: true
    });

    const token = jwt.sign({ managementId: management._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
    const link = `${req.protocol}://${req.get('host')}/api/v1/verify-account/${token}`;
    const firstName = management.fullName.split(' ')[0];

    const mailDetails = {
      subject: 'Email Verification',
      email: management.email,
      html: verify_account(link, firstName)
    };

    emailSender(mailDetails);
    await management.save();

    res.status(201).json({
      message: 'Management Account Created Successfully',
      data: management
    })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      meaasage: 'Error Registering Management'
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
          const { managementId } = jwt.decode(token);

          if (!managementId) {
            return res.status(404).json({
              message: 'ManagementId not found'
            })
          };

          const management = await managementModel.findById(managementId);

          if (!management) {
            return res.status(404).json({
              message: 'Management not found'
            })
          };

          if (management.isVerified === true) {
            return res.status(400).json({
              message: 'Management: Account has already been verified'
            })
          }

          const newToken = jwt.sign({ managementId: management._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
          const link = `${req.protocol}://${req.get('host')}/api/v1/verify-account/${newToken}`;
          const firstName = management.fullName.split(' ')[0];

          const mailDetails = {
            subject: 'Resend: Email Verification',
            email: management.email,
            html: verify_account(link, firstName)
          };

          emailSender(mailDetails);

          res.status(200).json({
            message: 'Session expired: Link has been sent to your Email address'
          })
        }
      } else {
        const management = await managementModel.findById(payload.managementId);

        if (!management) {
          return res.status(404).json({
            message: 'Management not found'
          })
        };

        if (management.isVerified === true) {
          return res.status(400).json({
            message: 'Management: Account has already been verified'
          })
        }

        management.isVerified = true;
        await management.save();

        res.status(200).json({
          message: 'Management: Account verified successfully'
        })
      }
    })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Verifying Management'
    })
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Please input email'
      })
    };

    if (!password) {
      return res.status(400).json({
        message: 'Please input password'
      })
    };

    const management = await managementModel.findOne({ email: email.toLowerCase() });

    if (!management) {
      return res.status(404).json({
        message: 'Account does not exist'
      })
    };

    const isCorrectPassword = await bcrypt.compare(password, management.password);

    if (!isCorrectPassword) {
      return res.status(400).json({
        message: 'Incorrect Password'
      })
    };

    if (management.isVerified === false) {
      const token = jwt.sign({ managementId: management._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
      const link = `${req.protocol}://${req.get('host')}/api/v1/verify-account/${token}`;
      const firstName = management.fullName.split(' ')[0];

      const mailDetails = {
        subject: 'Email Verification',
        email: management.email,
        html: verify_account(link, firstName)
      };

      emailSender(mailDetails);
      res.status(400).json({
        message: 'Account Not Verified: Link has been sent to your email'
      })
    };

    const token = jwt.sign({ managementId: management._id }, process.env.JWT_SECRET, { expiresIn: '1day' });

    res.status(200).json({
      message: 'Account Successfully Logged In',
      data: management.fullName,
      token
    })

  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Logging Management IN'
    })
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const management = await managementModel.findOne({ email: email.toLowercCase() });

    if (!management) {
      return res.status(404).json({
        message: 'Student not found'
      })
    };

    const token = jwt.sign({ managementId: management._id }, process.env.JWT_SECRET, { expiresIn: '1min' });
    const link = `${req.protocol}://${req.get('host')}/api/v1/reset-password/${token}`; //consumed link from frontend
    const firstName = management.fullName.split(' ')[0];

    const mailDetails = {
      subject: 'RESET PASSWORD',
      email: management.email,
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

    const { managementId } = jwt.decode(token);
    const management = await studentModel.findById(managementId);

    if (!management) {
      return res.status(404).json({
        message: 'Management not found'
      })
    };

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Password does not match'
      })
    };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    management.password = hashedPassword;
    await management.save();

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

    const management = await managementModel.findById(id);

    if (!management) {
      return res.status(404).json({
        message: 'Management not found'
      })
    };

    const isCorrectPassword = await bcrypt.compare(password, management.password);

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
    management.password = hashedPassword;
    await management.save();

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


exports.registerTeacher = async (req, res) => {
  try {
    const { fullName, email, gender, stack, password, confirmPassword } = req.body;

    if (!fullName || !email || !gender || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Please input all field'
      })
    };

    const existingTeacher = await teacherModel.findOne({ email: email.toLowerCase() });
    const management = await managementModel.find();

    if (existingTeacher) {
      return res.status(400).json({
        message: `Account with ${email} already exist`
      })
    };

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Password does not match'
      })
    }

    const saltedRound = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltedRound);

    const newTeacher = new teacherModel({
      fullName,
      email,
      gender,
      stack,
      password: hashedPassword,
    });

    const token = jwt.sign({ teacherId: newTeacher._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
    const link = `${req.protocol}://${req.get('host')}/api/v1/verify-account/${token}`;
    const firstName = newTeacher.fullName.split(' ')[0];

    const mailDetails = {
      subject: 'Email Verification',
      email: newTeacher.email,
      html: verify_account(link, firstName)
    };

    emailSender(mailDetails);
    await newTeacher.save();
    management.map((e) => e.teacherId.push(newTeacher._id));
    res.status(201).json({
      message: 'Teacher Account Created Successfully',
      data: newTeacher
    })

  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Registering Teachers'
    })
  }
};


exports.getTeachers = async (req, res) => {
  try {
    const teachers = await teacherModel.find();

    res.status(200).json({
      message: 'List of all Teachers below',
      totalTeachers: teachers.length,
      data: teachers
    })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Getting All Teachers'
    })
  }
};


exports.getTeacherAndAssignedStudents = async (req, res) => {
  try {
    const { teacherStack } = req.params;
    const teacher = await teacherModel.findOne({ stack: teacherStack });

    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found'
      })
    };

    const result = teacher.populate('fullName', 'email', 'gender', 'stack')
    res.status(200).json({
      message: 'Teacher and assigned students listed below',
      data: result,
      totalStudents: teacher.studentId.length
    })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Getting All Teachers'
    })
  }
};


exports.makeTeacherAdmin = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await teacherModel.findOne({ _id: teacherId });

    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found'
      })
    };

    if (teacher.isAdmin === true) {
      return res.status(400).json({
        message: 'Teacher is already an admin'
      })
    };

    if (teacher.isVerified === false) {
      const token = jwt.sign({ teacherId: teacher._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
      const link = `${req.protocol}://${req.get('host')}/api/v1/verify-account/${token}`;
      const firstName = teacher.fullName.split(' ')[0];

      const mailDetails = {
        subject: 'Email Verification',
        email: teacher.email,
        html: verify_account(link, firstName)
      };

      emailSender(mailDetails);
      return res.status(400).json({
        message: 'Account not verified, Link has been sent to email address'
      })
    };

    teacher.isAdmin = true;
    await teacher.save();

    res.status(200).json({
      message: 'Teacher is now an admin'
    })
  } catch (error) {
    console.log(error.message);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({
        message: 'Session expired, Please login to continue'
      })
    }
    res.status(500).json({
      message: 'Error Making Teacher Admin'
    })
  }
};


exports.removeTeacherAsAdmin = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await teacherModel.findOne({ _id: teacherId });

    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found'
      })
    };

    if (teacher.isAdmin === false) {
      return res.status(400).json({
        message: 'Teacher is not an admin'
      })
    }

    teacher.isAdmin = false;
    await teacher.save();

    res.status(200).json({
      message: 'Teacher is no longer an admin'
    })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Dismising Teacher As Admin'
    })
  }
};


exports.updateTeacher = async (req, res) => {
  try {
      const { teacherId } = req.params

      const { fullName, stack } = req.body;

      const teacher = await teacherModel.findById(teacherId)

      if (!teacher) {
          return res.status(404).json({
              message: "teacher not found"
          })
      };

      const data = {
          fullName,
          stack
      }

      const updatedteacher = await teacherModel.findByIdAndUpdate(teacher, data, { new: true })

      res.status(200).json({
          message: "teacher updated successfully",
          date: updatedteacher
      })

  } catch (error) {
      console.error(error);
      res.status(500).json({
          message: "Internal server error",
      });
  }
};


exports.deleteTeacher = async (req, res) => {
  try {
    const { managementId, teacherId } = req.params;
    const { email } = req.body;

    const teacher = await teacherModel.findOne({ _id: teacherId }, { email: email.toLowerCase() });

    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found'
      })
    };

    const deletedTeacher = await teacherModel.findByIdAndDelete(teacher._id);

    if (deletedTeacher) {
      const management = await managementModel.findById(managementId);
      management.teacherId.pop(deletedTeacher._id);

      return res.status(200).json({
        message: 'Teacher deleted successfully'
      })
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Deleting Teacher'
    })
  }
};


exports.registerStudent = async (req, res) => {
  try {
    const { fullName, email, gender, stack, password, confirmPassword } = req.body;

    if (!fullName || !email || !gender || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Please input all field'
      })
    };

    const existingStudent = await studentModel.findOne({ email: email.toLowerCase() });

    if (existingStudent) {
      return res.status(400).json({
        message: `Account with ${email} already exist`
      })
    };

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Password does not match'
      })
    }

    const saltedRound = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, saltedRound);

    const newStudent = new studentModel({
      fullName,
      email,
      gender,
      stack,
      password: hashedPassword,
    });

    const token = jwt.sign({ studentId: newStudent._id }, process.env.JWT_SECRET, { expiresIn: '5mins' });
    const link = `${req.protocol}://${req.get('host')}/api/v1/verify-account/${token}`;
    const firstName = newStudent.fullName.split(' ')[0];

    const mailDetails = {
      subject: 'Email Verification',
      email: newStudent.email,
      html: verify_account(link, firstName)
    };

    emailSender(mailDetails);
    await newStudent.save();
    const management = await managementModel.find();
    management.map((e) => e.studentId.push(newStudent._id));

    if (newStudent.stack === 'Frontend') {
      const teacher = await teacherModel.findOne({ stack: newStudent.stack });

      if (!teacher) {
        return res.status(404).json({
          message: 'Teacher not found'
        })
      };

      teacher.studentId.push(newStudent._id);
      await teacher.save();

      res.status(201).json({
        message: 'student Account Created Successfully',
        data: newStudent
      })
    } else if (newStudent.stack === 'Backend') {
      const teacher = await teacherModel.findOne({ stack: newStudent.stack });

      if (!teacher) {
        return res.status(404).json({
          message: 'Teacher not found'
        })
      };

      teacher.studentId.push(newStudent._id);
      await teacher.save();

      res.status(201).json({
        message: 'student Account Created Successfully',
        data: newStudent
      })
    } else if (newStudent.stack === 'Product-Design') {
      const teacher = await teacherModel.findOne({ stack: newStudent.stack });

      if (!teacher) {
        return res.status(404).json({
          message: 'Teacher not found'
        })
      };

      teacher.studentId.push(newStudent._id);
      await teacher.save();

      res.status(201).json({
        message: 'student Account Created Successfully',
        data: newStudent
      })
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Registering students'
    })
  }
};


exports.getStudents = async (req, res) => {
  try {
    const students = await studentModel.find();

    res.status(200).json({
      message: 'List of all Students below',
      totalStudents: students.length,
      data: students
    })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Getting students'
    })
  }
};


exports.getStudentByStack = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { stack } = req.body;

    const student = await studentModel.findOne({ _id: studentId }, { stack: stack });

    if (!student) {
      return res.status(404).json({
        message: 'Student not found'
      })
    };

    res.status(200).json({
      message: 'Student info below',
      data: student
    })
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Getting student'
    })
  }
};


exports.updateStudent = async (req, res) => {
  try {
      const { studentId } = req.params

      const { fullName, stack } = req.body;

      const student = await studentModel.findById(studentId)

      if (!student) {
          return res.status(404).json({
              message: "student not found"
          })
      };

      const data = {
          fullName,
          stack
      }

      const updatedStudent = await studentModel.findByIdAndUpdate(student, data, { new: true })

      res.status(200).json({
          message: "student updated successfully",
          date: updatedStudent
      })

  } catch (error) {
      console.error(error);
      res.status(500).json({
          message: "Internal server error",
      });
  }
};


exports.deleteStudent = async (req, res) => {
  try {
    const { managementId, studentId } = req.params;
    const { email } = req.body;

    const student = await studentModel.findOne({ _id: studentId }, { email: email.toLowerCase() });

    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found'
      })
    };

    const deletedStudent = await studentModel.findByIdAndDelete(student._id);

    if (deletedStudent) {
      const management = await managementModel.findById(managementId);
      management.studentId.pop(deletedStudent._id);

      return res.status(200).json({
        message: 'Student deleted successfully'
      })
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: 'Error Deleting Student'
    })
  }
};