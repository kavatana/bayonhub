import { Router } from "express"

import { requireAuth } from "../../middleware/auth"
import {
  authLimiter,
  forgotPasswordLimiter,
  ipBlockMiddleware,
  loginLimiter,
  otpVerifyLimiter,
  otpLimiter,
  registerLimiter,
} from "../../middleware/rateLimiter"
import {
  getMe,
  login,
  logout,
  logoutAll,
  refreshTokens,
  register,
  resetPassword,
  sendPhoneOtp,
  sendAdminTwoFactor,
  sendOtp,
  verifyAdminTwoFactor,
  verifyPhoneOtp,
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
router.post("/verify-otp", otpVerifyLimiter, validateVerifyOtp, verifyOtp)
router.post("/otp/send", forgotPasswordLimiter, otpLimiter, validateSendOtp, sendPhoneOtp)
router.post("/otp/verify", otpVerifyLimiter, validateVerifyOtp, requireAuth, verifyPhoneOtp)
router.post("/admin/2fa/send", requireAuth, otpLimiter, sendAdminTwoFactor)
router.post("/admin/2fa/verify", requireAuth, otpVerifyLimiter, verifyAdminTwoFactor)
router.put("/reset-password", authLimiter, validateResetPassword, resetPassword)
// F1.1 — 5 attempts / 15 min + IP auto-block after 20 failures
router.post("/login", ipBlockMiddleware, loginLimiter, validateLogin, login)
router.post("/refresh", refreshTokens)
router.delete("/logout", logout)
// F1.7 — Logout from all devices
router.post("/logout-all", requireAuth, logoutAll)
router.get("/me", requireAuth, getMe)
mountOAuthRoutes(router)

export default router
