const { sendOTPEmail } = require('./utils/mailer');
require('dotenv').config();
sendOTPEmail("aaryavagupta@gmail.com", "123456", "Test").then(() => console.log("Success")).catch(e => console.error("Error:", e));
