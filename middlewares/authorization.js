const managementModel = require('../models/management');
const teacherModel = require('../models/teacher');
const studentModel = require('../models/student');
const jwt = require('jsonwebtoken');

exports.authorizeStudent = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth) {
      return res.status(400).json({
        message: 'Student Authorization: Token not found'
      })
    };

    const token = auth.split(' ')[1];

    if (!token) {
      return res.status(400).json({
        message: 'Student Authorization: Invalid token'
      })
    };

    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = await studentModel.findById(decodedToken);

    if (!userId) {
      return res.status(404).json({
        message: 'Student Authorization: Student not found'
      })
    }

    if (userId.isAdmin === false && userId.isSuperAdmin === false) {
      return res.status(301).json({
        message: "Unauthorized: Student can't perform this action"
      })
    }

    req.user = decodedToken

    next()

  } catch (error) {
    console.log(error.message);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({
        message: 'Student Authorization: Session timeout, Please login to continue'
      })
    }
    res.status(500).json({
      message: 'Authorizing Student Failed'
    })
  }
}

exports.authorizeTeacher = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth) {
      return res.status(400).json({
        message: 'Teacher Authorization: Token not found'
      })
    };

    const token = auth.split(' ')[1];

    if (!token) {
      return res.status(400).json({
        message: 'Teacher Authorization: Invalid token'
      })
    };

    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = await studentModel.findById(decodedToken);

    if (!userId) {
      return res.status(404).json({
        message: 'Teacher Authorization: Teacher not found'
      })
    }

    if (userId.isSuperAdmin === false) {
      return res.status(301).json({
        message: "Unauthorized: Teacher can't perform this action"
      })
    }

    req.user = decodedToken

    next()

  } catch (error) {
    console.log(error.message);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({
        message: 'Teacher Authorization: Session timeout, Please login to continue'
      })
    }
    res.status(500).json({
      message: 'Authorizing Teacher Failed'
    })
  }
}

exports.authorizeManagement = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth) {
      return res.status(400).json({
        message: 'Management Authorization: Token not found'
      })
    };

    const token = auth.split(' ')[1];

    if (!token) {
      return res.status(400).json({
        message: 'Management Authorization: Invalid token'
      })
    };

    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = await studentModel.findById(decodedToken);

    if (!userId) {
      return res.status(404).json({
        message: 'Management Authorization: Management not found'
      })
    }

    req.user = decodedToken

    next()

  } catch (error) {
    console.log(error.message);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({
        message: 'Management Authorization: Session timeout, Please login to continue'
      })
    }
    res.status(500).json({
      message: 'Authorizing Management Failed'
    })
  }
}

