const { sendEmail } = require('../../services/nodemailer');
const EmailTemplate = require('../../services/emailTemplates');

class EmailDebugController {
  constructor() {
    this.testEmail = this.testEmail.bind(this);
  }

  async testEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Customize the email template configuration
      EmailTemplate.updateConfig({
        title: 'Email Debugging - Barangay Sta. Monica of Quezon City',
        header: 'Test Email',
        body: 'Hi, this is only test email (Test email debugging...)\nThis is a new line.',
        button: false,
        footer: 'If you have issues, please let us know.\nBest,\n~ Barangay Sta. Monica Team'
      });

      // Get the rendered HTML
      const emailContent = EmailTemplate.getHTML();

      await sendEmail({
        to: email,
        subject: EmailTemplate.config.title,
        html: emailContent,
      });

      res.status(201).json({
        message: 'Email provided was sent.',
        success: true
      });

    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  }
}

module.exports = new EmailDebugController();
