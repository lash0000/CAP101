class EmailTemplate {
  constructor(config = {}) {
    this.config = {
      title: '',
      companyName: '',
      logo_banner: true,
      header: '',
      body: '',
      button: true,
      buttonText: '',
      footer: ''
    };
    this.styleTemplate = `
      html {
        font-family: 'Segoe UI', sans-serif;
      }
      .bg-card {
        background: white;
        padding: 24px;
        border-radius: 48px;
      }
    `;
    this.updateConfig(config);
  }

  updateConfig(config) {
    this.config = { ...this.config, ...config };
  }

  getHTML() {
    const { title, companyName, logo_banner, header, body, button, buttonText, footer } = this.config;

    let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>${this.styleTemplate}</style>
</head>
<body>
    <table role="presentation">
        <tr>
            <td class="bg-card">
                <div>
    `;

    if (logo_banner) {
      htmlContent += `<a href="#"><img src="${companyName || ''}" alt="Logo"></a>`;
    }

    htmlContent += `
                </div>
                <div>
                    <h1>${header || ''}</h1>
                    <article style="white-space: pre-line">${body || ''}</article>
    `;

    if (button) {
      htmlContent += `<div><a href="#">${buttonText || ''}</a></div>`;
    }

    htmlContent += `
                    <div style="white-space: pre-line">${footer || ''}</div>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return htmlContent;
  }
}

module.exports = new EmailTemplate();
