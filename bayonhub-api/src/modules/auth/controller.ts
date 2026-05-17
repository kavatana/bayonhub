import type { RequestHandler } from "express"

import {
  clearAuthCookies,
  getMe as getMeService,
  loginUser,
  logoutAllSessions,
  logoutUser,
  refreshAuthTokens,
  registerUser,
  resetPassword as resetPasswordService,
  sendAdminTwoFactorOTP,
  sendPhoneOTP,
  sendOTP,
  verifyAdminTwoFactorOTP,
  verifyPhoneOTP,
  verifyOTP,
} from "./service"
import { getClientIp } from "../../middleware/rateLimiter"

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await registerUser(
      res,
      req.body.phone,
      req.body.password,
      req.body.name,
      req.body.language,
      req.body.ref || req.query.ref,
    )
    res.status(201).json({ user })
  } catch (error) {
    next(error)
  }
}

export const sendOtp: RequestHandler = async (req, res, next) => {
  try {
    const result = await sendOTP(req.body.phone)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const verifyOtp: RequestHandler = async (req, res, next) => {
  try {
    const user = await verifyOTP(req.body.phone, req.body.code)
    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}

export const sendPhoneOtp: RequestHandler = async (req, res, next) => {
  try {
    const result = await sendPhoneOTP(req.body.phone)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const verifyPhoneOtp: RequestHandler = async (req, res, next) => {
  try {
    const result = await verifyPhoneOTP(req.user?.id, req.body.phone, req.body.code)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

function requireAdminUser(req: Parameters<RequestHandler>[0]) {
  if (!req.user?.isAdmin) {
    const error = new Error("Forbidden") as Error & { status: number }
    error.status = 403
    throw error
  }
}

export const sendAdminTwoFactor: RequestHandler = async (req, res, next) => {
  try {
    requireAdminUser(req)
    const result = await sendAdminTwoFactorOTP(req.user!.id)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const verifyAdminTwoFactor: RequestHandler = async (req, res, next) => {
  try {
    requireAdminUser(req)
    const code = typeof req.body.code === "string" ? req.body.code : ""
    if (!/^\d{6}$/.test(code)) {
      const error = new Error("OTP must be 6 digits") as Error & { status: number }
      error.status = 400
      throw error
    }
    const result = await verifyAdminTwoFactorOTP(req.user!.id, code)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const result = await resetPasswordService(req.body.phone, req.body.code, req.body.newPassword)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const login: RequestHandler = async (req, res, next) => {
  try {
    const ip = getClientIp(req)
    const user = await loginUser(res, req.body.phone, req.body.password, ip)
    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}

export const refreshTokens: RequestHandler = async (req, res, next) => {
  try {
    const user = await refreshAuthTokens(res, req.cookies?.refreshToken)
    res.status(200).json({ user })
  } catch (error) {
    next(error)
  }
}

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const result = await logoutUser(req.cookies?.refreshToken)
    clearAuthCookies(res)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

// F1.7 — Logout from all devices
export const logoutAll: RequestHandler = async (req, res, next) => {
  try {
    const result = await logoutAllSessions(req.user!.id)
    clearAuthCookies(res)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }
    const user = await getMeService(req.user.id)
    res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}
