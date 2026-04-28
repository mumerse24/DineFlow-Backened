const express = require("express");
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");

const router = express.Router();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @route   POST /api/contact
// @desc    Send contact form message
// @access  Public
router.post(
  "/",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("subject")
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Subject must be between 5 and 200 characters"),
    body("message")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Message must be between 10 and 1000 characters"),
    body("phone").optional().isMobilePhone().withMessage("Please enter a valid phone number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { name, email, subject, message, phone } = req.body;

      // Email content to admin
      const emailContent = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <hr>
        <p><small>Sent from Food Delivery Platform Contact Form</small></p>
      `;

      // Send email to admin
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `Contact Form: ${subject}`,
        html: emailContent,
        replyTo: email,
      });

      // Send confirmation email to user
      const confirmationContent = `
        <h2>Thank you for contacting us!</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <p>Best regards,<br>Food Delivery Team</p>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Thank you for contacting us",
        html: confirmationContent,
      });

      res.json({
        success: true,
        message: "Message sent successfully. We'll get back to you soon!",
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send message. Please try again later.",
      });
    }
  }
);

module.exports = router;
