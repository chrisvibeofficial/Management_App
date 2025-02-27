require('dotenv').config();
require('./config/database');
const express = require('express');
const PORT = process.env.PORT || 4463;
const app = express();
const studentRouter = require('./routes/studentRouter');
const managementRouter = require('./routes/managementRouter');
const teacherRouter = require('./routes/teacherRouter');

app.use(express.json());
app.use('/api/v1', studentRouter);
app.use('/api/v1', managementRouter);
app.use('/api/v1', teacherRouter);

app.listen(PORT, () => {
  console.log('server is up and running on', PORT)
})