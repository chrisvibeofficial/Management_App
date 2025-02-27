const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
        week: {
                type: Number,
                required: true
        },
        punctuality: {
                type: Number,
                required: true
        },
        attendance: {
                type: Number,
                required: true
        },
        assigment: {
                type: Number,
                required: true
        },
        classAccessment: {
                type: Number,
                required: true
        },
        personalDefense: {
                type: Number,
                required: true
        },
        totalScore: {
                type: Number,
                required: true
        },
        averageScore: {
                type: String,
                required: true
        },
        studentName: {
                type: String,
                required: true
        },
        studentId: {
                type: mongoose.SchemaTypes.ObjectId,
                ref: "students"
        }
})
const scoreModel = mongoose.model('scores', scoreSchema);

module.exports = scoreModel;
