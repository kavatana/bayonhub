import { create } from "zustand"
import { getStorefront, submitReview } from "../api/storefront"

export const useStorefrontStore = create((set, get) => ({
  currentStorefront: null,
  loading: false,
  error: null,

  fetchStorefront: async (identifier) => {
    set({ loading: true, error: null })
    try {
      const data = await getStorefront(identifier)
      set({ currentStorefront: data, loading: false })
      return data
    } catch (error) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  postReview: async (reviewData) => {
    try {
      const newReview = await submitReview(reviewData)
      const current = get().currentStorefront
      if (current && current.id === reviewData.sellerId) {
        set({
          currentStorefront: {
            ...current,
            reviewsReceived: [newReview, ...(current.reviewsReceived || [])]
          }
        })
      }
      return newReview
    } catch (error) {
      console.error("Review failed:", error)
      throw error
    }
  }
}))
