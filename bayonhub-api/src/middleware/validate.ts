import type { RequestHandler } from "express"
import { validationResult } from "express-validator"

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Validation failed", details: errors.array() })
  }
  next()
}
