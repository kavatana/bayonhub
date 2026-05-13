import type { RequestHandler } from "express"
import { validationResult } from "express-validator"

export const validate: RequestHandler = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const first = errors.array()[0]
    if (first && typeof first.msg === "object" && "error" in first.msg && "message" in first.msg) {
      return res.status(400).json(first.msg)
    }
    return res.status(400).json({ error: "Validation failed", details: errors.array() })
  }
  next()
}
