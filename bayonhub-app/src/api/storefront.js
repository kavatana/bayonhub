import client from "./client"

export const getStorefront = async (identifier) => {
  try {
    const response = await client.get(`/storefront/${identifier}`, { _csrfRetry: true })
    return response.data
  } catch (error) {
    if (error?.response?.status === 403 && error?.response?.data?.error === "PLUS_REQUIRED") {
      throw new Error("PLUS_REQUIRED", { cause: error })
    }
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
