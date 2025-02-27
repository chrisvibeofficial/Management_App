const mongoose = require('mongoose')
require('dotenv').config();
const db = process.env.MONGOOSE_URI
mongoose.connect(db)
.then(()=>{
    console.log('connection to database has been established');
    
})
.catch((error)=>{
console.log('connection to database has failed'+error.message);

})