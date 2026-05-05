import { Request, Response } from "express"
import * as storefrontService from "./service"

export const getStorefront = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params
    let storefront

    // Check if identifier is a UUID or a slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(identifier as string)) {
      storefront = await storefrontService.getStorefrontById(identifier as string)
    } else {
      storefront = await storefrontService.getStorefrontBySlug(identifier as string)
    }

    if (!storefront) {
      return res.status(404).json({ message: "Storefront not found" })
    }

    res.json(storefront)
  } catch (error) {
    res.status(500).json({ message: "Error fetching storefront", error })
  }
}

export const postReview = async (req: Request, res: Response) => {
  try {
    const { rating, comment, sellerId, listingId } = req.body
    const reviewerId = req.user?.id

    if (!reviewerId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    if (reviewerId === sellerId) {
      return res.status(400).json({ message: "You cannot review yourself" })
    }

    const review = await storefrontService.createReview({
      rating,
      comment,
      reviewerId,
      sellerId,
      listingId
    })

    res.status(201).json(review)
  } catch (error) {
    res.status(500).json({ message: "Error creating review", error })
  }
}
