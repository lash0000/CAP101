const path = require("path");
const Email = require("email-templates");

class EmailTemplate {
  constructor() {
    this.email = new Email({
      views: {
        root: path.join(__dirname, "templates"),
        options: { extension: "pug" },
      },
      juice: true,
      preview: process.env.NODE_ENV !== "production",
      send: false,
    });

    this.config = {
      locals: {
        title: "",
        header: "",
        body: "",
        button: false,
        footer: "",
      },
    };
  }

  // Update locals passed to Pug
  updateConfig(newConfig) {
    this.config.locals = { ...this.config.locals, ...newConfig };
  }

  // Render HTML (html.pug)
  async getHTML(templateName) {
    return this.email.render(`${templateName}/html`, this.config.locals);
  }

  async getSubject(templateName) {
    return this.email.render(`${templateName}/subject`, this.config.locals);
  }
}

module.exports = new EmailTemplate();
