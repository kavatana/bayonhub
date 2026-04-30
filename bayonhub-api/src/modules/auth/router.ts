import { Router } from "express"

import { requireAuth } from "../../middleware/auth"
import { authLimiter, otpLimiter } from "../../middleware/rateLimiter"
import {
  getMe,
  login,
  logout,
  refreshTokens,
  register,
  sendOtp,
  verifyOtp,
} from "./controller"
import {
  validateLogin,
  validateRegister,
  validateSendOtp,
  validateVerifyOtp,
} from "./validators"

const router = Router()

router.post("/register", authLimiter, validateRegister, register)
router.post("/send-otp", otpLimiter, validateSendOtp, sendOtp)
router.post("/verify-otp", validateVerifyOtp, verifyOtp)
router.post("/login", authLimiter, validateLogin, login)
router.post("/refresh", refreshTokens)
router.delete("/logout", logout)
router.get("/me", requireAuth, getMe)

export default router
