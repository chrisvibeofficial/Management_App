const managementModel = require("../models/management");
const teacherModel = require("../models/teacher");
const studentModel = require("../models/student");
const jwt = require("jsonwebtoken");

exports.auth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(400).json({
        message: "Token not found",
      });
    }
    const token = auth.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        message: "Invalid token",
      });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    user = await managementModel.findById(decodedToken.managementId);
    user = await teacherModel.findById(decodedToken.teacherId)
    user = await studentModel.findById(decodedToken.studentId)
    if (!user) {
      return res.status(404).json({
        message: "Authentication Failed: Student not found",
      });
    }
    req.user = decodedToken;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        message: "Session timed-out: Please login to continue",
      });
    }
    res.status(500).json({
      message: "Internal Server Error" + error.message,
    });
  }
};

exports.adminAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(400).json({
        message: "Token not found",
      });
    }

    const token = auth.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    user = await managementModel.findById(decodedToken.userId);
    user = await teacherModel.findById(decodedToken.teacherId)
    if (!user) {
      return res.status(404).json({
        message: "Authentication Failed: Admin not found",
      });
    }

    if (user.isAdmin !== true && user.isSuperAdmin !== true) {
      return res.status(401).json({
        message: "Unauthorized: Please contact Admin",
      });
    }

    req.user = decodedToken;
    next();

  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error" + error.message,
    });
  }
};

exports.superAdminAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(400).json({
        message: "Token not found",
      });
    }

    const token = auth.split(" ")[1];
    if (!token) {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await managementModel.findById(decodedToken.managementId);
    if (!user) {
      return res.status(404).json({
        message: "Authentication Failed: Management not found",
      });
    }

    if (user.isSuperAdmin !== true) {
      return res.status(401).json({
        message: "Unauthorized: Please contact Management",
      });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error" + error.message,
    });
  }
};