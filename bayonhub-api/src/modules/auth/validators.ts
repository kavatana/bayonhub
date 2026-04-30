import { body } from "express-validator"

import { validate } from "../../middleware/validate"

const cambodiaPhoneRegex = /^\+855[1-9][0-9]{7,8}$/

export const validateRegister = [
  body("phone").matches(cambodiaPhoneRegex).withMessage("Invalid Cambodia phone number"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("language").optional().isIn(["en", "km"]),
  validate,
]

export const validateLogin = [
  body("phone").notEmpty().withMessage("Phone is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
]

export const validateSendOtp = [
  body("phone").notEmpty().withMessage("Phone is required"),
  validate,
]

export const validateVerifyOtp = [
  body("phone").notEmpty().withMessage("Phone is required"),
  body("code").isLength({ min: 6, max: 6 }).isNumeric().withMessage("OTP must be 6 digits"),
  validate,
]
