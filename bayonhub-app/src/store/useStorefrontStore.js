import { create } from "zustand"
import { getStorefront, submitReview as submitReviewApi } from "../api/storefront"

function getAverageRating(reviews = []) {
  if (!reviews.length) return 0
  const total = reviews.reduce((sum, review) => sum + Number(review.stars || review.rating || 0), 0)
  return total / reviews.length
}

export const useStorefrontStore = create((set, get) => ({
  currentStorefront: null,
  reviews: [],
  averageRating: 0,
  topRated: false,
  trustedSeller: false,
  loading: false,
  error: null,

  fetchStorefront: async (identifier) => {
    set({ loading: true, error: null })
    try {
      const data = await getStorefront(identifier)
      const reviews = data?.reviewsReceived || data?.reviews || []
      const averageRating = getAverageRating(reviews)
      set({
        currentStorefront: data,
        reviews,
        averageRating,
        topRated: averageRating >= 4.5 && reviews.length >= 5,
        trustedSeller: averageRating >= 4 && reviews.length >= 10,
        loading: false,
      })
      return data
    } catch (error) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  fetchReviews: async (sellerId) => {
    const current = get().currentStorefront
    const reviews = current && String(current.id) === String(sellerId)
      ? current.reviewsReceived || current.reviews || []
      : get().reviews
    const averageRating = getAverageRating(reviews)
    set({
      reviews,
      averageRating,
      topRated: averageRating >= 4.5 && reviews.length >= 5,
      trustedSeller: averageRating >= 4 && reviews.length >= 10,
    })
    return reviews
  },

  submitReview: async (sellerId, reviewData) => {
    try {
      const payload = {
        ...reviewData,
        rating: reviewData.stars || reviewData.rating,
        stars: reviewData.stars || reviewData.rating,
        sellerId,
      }
      const newReview = await submitReviewApi(payload)
      const current = get().currentStorefront
      const normalizedReview = {
        ...newReview,
        stars: newReview.stars || newReview.rating || payload.stars,
        rating: newReview.rating || newReview.stars || payload.rating,
        tags: newReview.tags || payload.tags || [],
      }
      const nextReviews = [normalizedReview, ...get().reviews]
      const averageRating = getAverageRating(nextReviews)
      if (current && String(current.id) === String(sellerId)) {
        set({
          currentStorefront: {
            ...current,
            reviewsReceived: [normalizedReview, ...(current.reviewsReceived || [])],
          },
          reviews: nextReviews,
          averageRating,
          topRated: averageRating >= 4.5 && nextReviews.length >= 5,
          trustedSeller: averageRating >= 4 && nextReviews.length >= 10,
        })
      } else {
        set({
          reviews: nextReviews,
          averageRating,
          topRated: averageRating >= 4.5 && nextReviews.length >= 5,
          trustedSeller: averageRating >= 4 && nextReviews.length >= 10,
        })
      }
      return normalizedReview
    } catch (error) {
      console.error("Review failed:", error)
      throw error
    }
  },

  postReview: async (reviewData) => get().submitReview(reviewData.sellerId, reviewData),
}))
