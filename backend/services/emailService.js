const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Send a contact message email
   * @param {Object} data - Contact form data
   * @param {string} data.name - Sender name
   * @param {string} data.email - Sender email
   * @param {string} data.subject - Message subject
   * @param {string} data.message - Message content
   */
  async sendContactEmail({ name, email, subject, message }) {
    const contactEmail = process.env.CONTACT_EMAIL || 'srikantaboddapati.work@gmail.com';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: contactEmail,
      subject: `[ChessDate Contact] ${subject}`,
      text: `
        New message from ChessDate Contact Form:
        
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        
        Message:
        ${message}
      `,
      html: `
        <h3>New message from ChessDate Contact Form</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Subject:</b> ${subject}</p>
        <p><b>Message:</b></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
