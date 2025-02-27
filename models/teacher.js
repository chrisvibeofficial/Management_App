const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        required: true
    },
    stack: {
        type: String,
        required: true,
        enum: ['Frontend', 'Backend', 'Product-Design']
    },
    isVerified: {
        type: Boolean,
        defult: false

    },
    isAdmin: {
        type: Boolean,
        defult: false

    },
    studentId: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: "students"
    }]
})
const teacherModel = mongoose.model('teachers', teacherSchema);

module.exports = teacherModel;
