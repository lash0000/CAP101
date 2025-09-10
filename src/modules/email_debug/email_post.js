const { sendEmail } = require("../../services/nodemailer");
const emailTemplate = require("../../services/email.template");

class EmailDebugController {
  constructor() {
    this.testEmail = this.testEmail.bind(this);
  }

  async testEmail(req, res) {
    try {
      const { email, firstName } = req.body;

      // Validate request
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // derive a fallback name if not provided
      const headerName = firstName && firstName.trim()
        ? firstName.trim()
        : (email.split("@")[0] || "User");

      // Update template locals (these will be available in welcome/html.pug)
      emailTemplate.updateConfig({
        title: "Welcome Email — Barangay Sta. Monica",
        header: headerName,
        body: `Hello ${headerName},\n\nThanks for signing up! We’re excited to have you onboard. This is a test email for debugging purposes.`,
        button: { text: "Get Started", href: "https://example.com/start" }, // set to false if you don't want a button
        footer: "Best regards,\nBarangay Sta. Monica Team",
      });

      // Render subject + HTML from template
      const subject = await emailTemplate.getSubject("welcome");
      const html = await emailTemplate.getHTML("welcome");

      return res.status(201).json({
        message: "Email provided was sent.",
        success: true,
        to: email,
        subject,
        body: {
          html,
        },
      });
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }
}

module.exports = new EmailDebugController();
