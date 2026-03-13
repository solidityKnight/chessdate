const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { submitContactForm } = require('../controllers/contactController');

// Rate limiting for contact form: 5 submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many messages sent. Please try again after 15 minutes.' }
});

router.post('/', [
  contactLimiter,
  check('name', 'Name is required').not().isEmpty().trim(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('subject', 'Subject is required').not().isEmpty().trim(),
  check('message', 'Message is required (min 10 chars)').isLength({ min: 10 }).trim()
], submitContactForm);

module.exports = router;
