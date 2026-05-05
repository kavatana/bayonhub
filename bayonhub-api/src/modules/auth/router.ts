import { Router } from "express"

import { requireAuth } from "../../middleware/auth"
import { authLimiter, forgotPasswordLimiter, otpLimiter, registerLimiter } from "../../middleware/rateLimiter"
import {
  getMe,
  login,
  logout,
  refreshTokens,
  register,
  resetPassword,
  sendOtp,
  verifyOtp,
} from "./controller"
import {
  validateLogin,
  validateRegister,
  validateResetPassword,
  validateSendOtp,
  validateVerifyOtp,
} from "./validators"
import { telegramWebhookHandler } from "./telegram"
import { mountOAuthRoutes } from "./oauth"

const router = Router()

router.post("/telegram-webhook", telegramWebhookHandler)

router.post("/register", registerLimiter, validateRegister, register)
router.post("/send-otp", forgotPasswordLimiter, otpLimiter, validateSendOtp, sendOtp)
router.post("/verify-otp", validateVerifyOtp, verifyOtp)
router.put("/reset-password", authLimiter, validateResetPassword, resetPassword)
router.post("/login", authLimiter, validateLogin, login)
router.post("/refresh", refreshTokens)
router.delete("/logout", logout)
router.get("/me", requireAuth, getMe)
mountOAuthRoutes(router)

export default router
