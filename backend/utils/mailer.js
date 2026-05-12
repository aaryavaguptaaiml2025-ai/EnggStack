const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(toEmail, otp, name) {
  try {
    const logoUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/cognit-logo.png` : "https://engg-stack-qol8.vercel.app/cognit-logo.png";
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: toEmail,
      subject: `${otp} — Your Cognit Secure Code`,
      html: `
        <div style="font-family:'Inter',system-ui,sans-serif;max-width:500px;margin:0 auto;background-color:#0B1220;border-radius:24px;overflow:hidden;border:1px solid #1f2937;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
          <div style="background:linear-gradient(180deg, #111827 0%, #0B1220 100%);padding:40px 32px;text-align:center;border-bottom:1px solid rgba(0,200,150,0.1);">
            <div style="margin-bottom:20px;">
              <img src="${logoUrl}" alt="Cognit" style="width:80px;height:80px;object-fit:contain;filter:drop-shadow(0 0 12px rgba(0,200,150,0.4));" />
            </div>
            <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Cognit</div>
            <div style="font-size:13px;color:#00C896;margin-top:6px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Engineering OS</div>
          </div>
          <div style="padding:40px 32px;background-color:#0B1220;">
            <p style="font-size:16px;color:#e5e7eb;margin:0 0 12px;font-weight:500;">Hi ${name || "there"} 👋,</p>
            <p style="font-size:15px;color:#9ca3af;margin:0 0 32px;line-height:1.6;">Your secure verification code is ready. Please use the code below to continue. It will expire in 10 minutes.</p>
            
            <div style="background:rgba(0,200,150,0.05);border:1px solid rgba(0,200,150,0.2);border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;box-shadow:inset 0 0 20px rgba(0,200,150,0.05);">
              <div style="font-size:48px;font-weight:800;letter-spacing:16px;color:#00C896;font-family:'JetBrains Mono',monospace,sans-serif;text-shadow:0 0 20px rgba(0,200,150,0.3);margin-left:16px;">${otp}</div>
            </div>
            
            <div style="border-top:1px solid #1f2937;padding-top:24px;text-align:center;">
              <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.5;">If you didn't request this code, you can safely ignore this email. Your account remains secure.</p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`[Cognit Mailer] OTP sent to ${toEmail}`);
  } catch (error) {
    console.error("[Cognit Mailer] Error:", error);
    throw new Error("Failed to send verification email");
  }
}

async function sendEmail(toEmail, subject, htmlContent) {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: toEmail,
      subject,
      html: htmlContent,
    });
    console.log(`[Cognit Mailer] Email sent to ${toEmail}: ${subject}`);
  } catch (error) {
    console.error("[Cognit Mailer] Error:", error);
    throw new Error("Failed to send email");
  }
}

module.exports = { generateOTP, sendOTPEmail, sendEmail };