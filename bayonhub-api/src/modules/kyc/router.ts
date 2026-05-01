import { randomUUID } from "crypto"
import { IDType } from "@prisma/client"
import { Router } from "express"

import { prisma } from "../../lib/prisma"
import { uploadPrivateDocument } from "../../lib/s3"
import { requireAuth } from "../../middleware/auth"
import { upload } from "../../middleware/upload"

const router = Router()

function createHttpError(status: number, message: string): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createHttpError(400, `${label} is required`)
  }
  return value.trim()
}

function parseIdType(value: unknown): IDType {
  if (value === "NATIONAL_ID" || value === "PASSPORT" || value === "DRIVING_LICENSE") return value
  throw createHttpError(400, "Invalid ID type")
}

function fileFromMap(
  files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
  field: string,
): Express.Multer.File | undefined {
  if (!files || Array.isArray(files)) return undefined
  return files[field]?.[0]
}

router.use(requireAuth)

router.post(
  "/submit",
  upload.fields([
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const fullName = requireString(req.body.fullName, "fullName")
      const idType = parseIdType(req.body.idType)
      const idNumber = requireString(req.body.idNumber, "idNumber")
      const idFront = fileFromMap(req.files, "idFront")
      const idBack = fileFromMap(req.files, "idBack")
      const selfie = fileFromMap(req.files, "selfie")

      if (!idFront) throw createHttpError(400, "idFront is required")

      const baseKey = `kyc/${req.user!.id}/${randomUUID()}`
      const idFrontKey = await uploadPrivateDocument(idFront.buffer, `${baseKey}-front.webp`)
      const idBackKey = idBack ? await uploadPrivateDocument(idBack.buffer, `${baseKey}-back.webp`) : null
      const selfieKey = selfie ? await uploadPrivateDocument(selfie.buffer, `${baseKey}-selfie.webp`) : null

      const application = await prisma.kYCApplication.upsert({
        where: { userId: req.user!.id },
        update: {
          fullName,
          idType,
          idNumber,
          idFrontKey,
          idBackKey,
          selfieKey,
          status: "PENDING",
          reviewNote: null,
          reviewedBy: null,
          reviewedAt: null,
        },
        create: {
          userId: req.user!.id,
          fullName,
          idType,
          idNumber,
          idFrontKey,
          idBackKey,
          selfieKey,
        },
      })

      res.status(201).json({ applicationId: application.id, status: application.status })
    } catch (error) {
      next(error)
    }
  },
)

router.get("/status", async (req, res, next) => {
  try {
    const application = await prisma.kYCApplication.findUnique({
      where: { userId: req.user!.id },
      select: {
        id: true,
        fullName: true,
        idType: true,
        idNumber: true,
        status: true,
        reviewNote: true,
        reviewedAt: true,
        submittedAt: true,
        updatedAt: true,
      },
    })
    res.status(200).json({ application })
  } catch (error) {
    next(error)
  }
})

export default router
