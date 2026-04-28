const { body } = require("express-validator")

const userValidation = {
  register: [
    body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("phone").isMobilePhone().withMessage("Please enter a valid phone number"),
    body("role").optional().isIn(["customer", "restaurant"]).withMessage("Invalid role"),
  ],
  login: [
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  updateProfile: [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("phone").optional().isMobilePhone().withMessage("Please enter a valid phone number"),
  ],
  changePassword: [
    body("currentPassword").exists().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
}

module.exports = { userValidation }
