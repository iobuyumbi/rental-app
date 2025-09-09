const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send email
const sendEmail = async (options) => {
  const transporter = createTransporter();

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);

  return info;
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `
    You requested a password reset.
    
    Please use the following link to reset your password:
    ${resetUrl}
    
    If you did not request this, please ignore this email.
    
    This link will expire in 10 minutes.
  `;

  await sendEmail({
    to: email,
    subject: "Password Reset Request",
    text: message,
  });
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  const message = `
    Welcome to Microfinance MIS, ${name}!
    
    Your account has been successfully created.
    
    You can now log in to your account and start using our services.
  `;

  await sendEmail({
    to: email,
    subject: "Welcome to Microfinance MIS",
    text: message,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
