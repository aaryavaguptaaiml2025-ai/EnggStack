const nodemailer = require("nodemailer");

// Creates a transporter using Gmail App Password
// Set GMAIL_USER and GMAIL_PASS in your Render environment variables
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    throw new Error("GMAIL_USER and GMAIL_PASS not set in environment variables");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(toEmail, otp, name) {
  const transporter = getTransporter();
  const from = process.env.GMAIL_USER;

  await transporter.sendMail({
    from: `"Cognit" <${from}>`,
    to: toEmail,
    subject: `${otp} — Your Cognit verification code`,
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;background:#0d0d0d;border-radius:16px;overflow:hidden">
        <div style="background:#0f172a;padding:28px 32px;text-align:center">
          <div style="width:52px;height:52px;background:#00C896;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#000;margin-bottom:12px">C</div>
          <div style="font-size:20px;font-weight:800;color:#f0f0f0">Cognit</div>
          <div style="font-size:13px;color:#888;margin-top:4px">Study Platform</div>
        </div>
        <div style="padding:32px">
          <p style="font-size:15px;color:#f0f0f0;margin:0 0 8px">Hi ${name || "there"} 👋</p>
          <p style="font-size:13px;color:#888;margin:0 0 24px">Here's your verification code:</p>
          <div style="background:#161616;border:1px solid #2a2a2a;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#00C896;font-family:monospace">${otp}</div>
            <div style="font-size:12px;color:#555;margin-top:8px">Expires in 10 minutes</div>
          </div>
          <p style="font-size:12px;color:#555;margin:0">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
}

module.exports = { generateOTP, sendOTPEmail };
