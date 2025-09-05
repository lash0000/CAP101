const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_SERVICE,
    pass: process.env.SMTP_APP,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Transporter Error:', error);
  } else {
    console.log('SMTP Transporter Ready');
  }
});

// Function to generate HTML email template
const generateEmailTemplate = ({ subject, recipientName, message, actionUrl, actionText }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background-color: #005b41;
          color: #ffffff;
          padding: 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 20px;
          line-height: 1.6;
          color: #333333;
        }
        .content p {
          margin: 0 0 15px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          margin: 10px 0;
          background-color: #005b41;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .footer {
          background-color: #f4f4f4;
          padding: 10px;
          text-align: center;
          font-size: 12px;
          color: #666666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sta. Monica's Portal</h1>
        </div>
        <div class="content">
          <p>Dear ${recipientName},</p>
          <p>${message}</p>
          ${actionUrl && actionText ? `
          <p><a href="${actionUrl}" class="button">${actionText}</a></p>
          ` : ''}
        </div>
        <div class="footer">
          <p>CAP101 Barangay Management System</p>
          <p>&copy; 2025 Barangay CAP101. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send email
const sendEmail = async ({ to, subject, recipientName, message, actionUrl, actionText }) => {
  try {
    const mailOptions = {
      from: `${process.env.SMTP_SERVICE}`,
      to,
      subject,
      html: generateEmailTemplate({ subject, recipientName, message, actionUrl, actionText }),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendEmail };
