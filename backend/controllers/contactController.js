const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');

exports.submitContactForm = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    console.log(`Sending contact email from ${name} (${email})...`);
    
    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not set. Logging message instead:');
      console.log(`Contact: ${name} (${email}) - Sub: ${subject} - Msg: ${message}`);
      return res.json({ 
        message: 'Message received! (Note: Email simulation mode)',
        success: true
      });
    }

    await emailService.sendContactEmail({ name, email, subject, message });

    res.json({ 
      message: 'Your message has been sent successfully. We will get back to you soon!',
      success: true 
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ 
      message: 'Failed to send message. Please try again later.',
      success: false 
    });
  }
};
