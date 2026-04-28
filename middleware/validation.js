const { body, param, query, validationResult } = require("express-validator")
const { AppError } = require("./errorHandler")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg)
    return next(new AppError(errorMessages.join(". "), 400))
  }
  next()
}

// User validation rules
const validateUserRegistration = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  body("phone").optional().isMobilePhone().withMessage("Please provide a valid phone number"),
  handleValidationErrors,
]

const validateUserLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
]

// Restaurant validation rules
const validateRestaurantRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Restaurant name must be between 2 and 100 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("phone").isMobilePhone().withMessage("Please provide a valid phone number"),
  body("address.street").trim().notEmpty().withMessage("Street address is required"),
  body("address.city").trim().notEmpty().withMessage("City is required"),
  body("address.state").trim().notEmpty().withMessage("State is required"),
  body("address.zipCode").isPostalCode("any").withMessage("Please provide a valid zip code"),
  body("cuisine").isArray({ min: 1 }).withMessage("At least one cuisine type is required"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  handleValidationErrors,
]

// Menu item validation rules
const validateMenuItem = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Item name must be between 2 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("price").isFloat({ min: 0.01 }).withMessage("Price must be a positive number"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("preparationTime").isInt({ min: 1, max: 120 }).withMessage("Preparation time must be between 1 and 120 minutes"),
  handleValidationErrors,
]

// Order validation rules
const validateOrder = [
  body("items").isArray({ min: 1 }).withMessage("Order must contain at least one item"),
  body("items.*.menuItem").isMongoId().withMessage("Invalid menu item ID"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  body("deliveryAddress.street").trim().notEmpty().withMessage("Delivery street address is required"),
  body("deliveryAddress.city").trim().notEmpty().withMessage("Delivery city is required"),
  body("deliveryAddress.zipCode").isPostalCode("any").withMessage("Please provide a valid delivery zip code"),
  body("paymentMethod").isIn(["cash", "card", "digital_wallet"]).withMessage("Invalid payment method"),
  handleValidationErrors,
]

// Contact form validation
const validateContactForm = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("subject").trim().isLength({ min: 5, max: 100 }).withMessage("Subject must be between 5 and 100 characters"),
  body("message").trim().isLength({ min: 10, max: 1000 }).withMessage("Message must be between 10 and 1000 characters"),
  handleValidationErrors,
]

// Parameter validation
const validateObjectId = [param("id").isMongoId().withMessage("Invalid ID format"), handleValidationErrors]

// Query validation
const validatePagination = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
]

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateRestaurantRegistration,
  validateMenuItem,
  validateOrder,
  validateContactForm,
  validateObjectId,
  validatePagination,
  handleValidationErrors,
}
