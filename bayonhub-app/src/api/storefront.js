import client from "./client"

export const getStorefront = async (identifier) => {
  try {
    const response = await client.get(`/storefront/${identifier}`)
    return response.data
  } catch (error) {
    // Local fallback logic
    const localStorefront = JSON.parse(localStorage.getItem(`bayonhub:storefront:${identifier}`))
    if (localStorefront) return localStorefront
    throw error
  }
}

export const submitReview = async (reviewData) => {
  try {
    const response = await client.post("/storefront/review", reviewData)
    return response.data
  } catch (err) {
    throw new Error(err?.response?.data?.error || err?.message || "ui.error", { cause: err })
  }
}
