import { body } from "express-validator"

import { validate } from "../../middleware/validate"

const cambodiaPhoneRegex = /^(\+855|0)(1[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])\d{6,7}$/
const invalidPhoneMessage = {
  error: "INVALID_PHONE",
  message: "Please enter a valid Cambodian phone number.",
}

export const validateRegister = [
  body("phone").matches(cambodiaPhoneRegex).withMessage(invalidPhoneMessage),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("language").optional().isIn(["en", "km"]),
  body("ref").optional().trim().isLength({ max: 32 }),
  validate,
]

export const validateLogin = [
  body("phone").notEmpty().withMessage("Phone is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
]

export const validateSendOtp = [
  body("phone").matches(cambodiaPhoneRegex).withMessage(invalidPhoneMessage),
  validate,
]

export const validateVerifyOtp = [
  body("phone").matches(cambodiaPhoneRegex).withMessage(invalidPhoneMessage),
  body("code").isLength({ min: 6, max: 6 }).isNumeric().withMessage("OTP must be 6 digits"),
  validate,
]

export const validateResetPassword = [
  body("phone").matches(cambodiaPhoneRegex).withMessage(invalidPhoneMessage),
  body("code").isLength({ min: 6, max: 6 }).isNumeric().withMessage("OTP must be 6 digits"),
  body("newPassword").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  validate,
]
