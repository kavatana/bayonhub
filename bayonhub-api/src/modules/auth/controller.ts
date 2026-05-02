import type { RequestHandler } from "express"

import {
  clearAuthCookies,
  getMe as getMeService,
  loginUser,
  logoutUser,
  refreshAuthTokens,
  registerUser,
  sendOTP,
  verifyOTP,
  checkOtpStatus as checkOtpStatusService,
} from "./service"

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await registerUser(
      res,
      req.body.phone,
      req.body.password,
      req.body.name,
      req.body.language,
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

export const checkOtpStatus: RequestHandler = async (req, res, next) => {
  try {
    const phone = req.query.phone as string
    if (!phone) {
      res.status(400).json({ error: "Phone is required" })
      return
    }
    const result = await checkOtpStatusService(res, phone)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const login: RequestHandler = async (req, res, next) => {
  try {
    const user = await loginUser(res, req.body.phone, req.body.password)
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
