require('dotenv').config();   // MUST BE FIRST

const { sendOTPEmail } = require('./utils/mailer');

sendOTPEmail("aaryavagupta@gmail.com", "123456")
  .then(() => console.log("Success"))
  .catch(e => console.error("Error:", e));