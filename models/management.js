const mongoose = require('mongoose');

const managementSchema = new mongoose.Schema({
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
    isVerified: {
        type: Boolean,
        defult: false

    },
    isSuperAdmin: {
        type: Boolean,
        defult: false

    },
    studentId: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: "students"
    }],
    teacherId: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: "teachers"
    }]
})
const managementModel = mongoose.model('managements', managementSchema);

module.exports = managementModel;
