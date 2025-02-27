const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
    scoreId: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: "scores"
    }]
})
const studentModel = mongoose.model('students', studentSchema);

module.exports = studentModel;
