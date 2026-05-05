import client, { hasApiBackend, readStorage, STORAGE_KEYS, writeStorage } from "./client"

function mockRegister(data) {
  const user = { id: Date.now(), verified: false, ...data }
  const token = `local-${btoa(`${data.phone}:reg:${Date.now()}`)}`
  writeStorage(STORAGE_KEYS.authToken, token)
  writeStorage(STORAGE_KEYS.authUser, user)
  return { user, token }
}

function mockLogin(phone, password) {
  const user = {
    id: "local-user",
    name: "BayonHub Seller",
    phone,
    verified: true,
  }
  const token = `local-${btoa(`${phone}:${password}:${Date.now()}`)}`
  writeStorage(STORAGE_KEYS.authToken, token)
  writeStorage(STORAGE_KEYS.authUser, user)
  return { user, token }
}

function mockSendOtp(phone) {
  console.log("[DEV OTP] Mock OTP sent to:", phone)
  const user = readStorage(STORAGE_KEYS.authUser, { phone })
  writeStorage(STORAGE_KEYS.authUser, { ...user, phone })
  return { ok: true, success: true }
}

function mockVerifyOTP(phone, code) {
  const token = `local-${btoa(`${phone}:otp:${Date.now()}`)}`
  writeStorage(STORAGE_KEYS.authToken, token)
  const user = readStorage(STORAGE_KEYS.authUser, { phone })
  const verifiedUser = { ...user, phone, verified: Boolean(code) }
  writeStorage(STORAGE_KEYS.authUser, verifiedUser)
  return { ok: true, token, user: verifiedUser }
}

export async function login(phone, password) {
  if (!hasApiBackend()) {
    return mockLogin(phone, password)
  }
  try {
    const response = await client.post("/api/auth/login", { phone, password }, { skipAuthExpired: true })
    return response.data.user || response.data
  } catch (error) {
    const status = error.response?.status
    if (status === 401) throw new Error("auth.invalidCredentials", { cause: error })
    if (status === 429) throw new Error("auth.tooManyAttempts", { cause: error })
    throw new Error(error.response?.data?.error || "auth.loginError", { cause: error })
  }
}

export async function logout() {
  if (hasApiBackend()) {
    const response = await client.delete("/api/auth/logout", { skipAuthRefresh: true, skipAuthExpired: true })
    return response.data
  }
  localStorage.removeItem(STORAGE_KEYS.authToken)
  localStorage.removeItem(STORAGE_KEYS.authUser)
  return { ok: true }
}

export async function register(data) {
  if (!hasApiBackend()) {
    return mockRegister(data)
  }
  try {
    const response = await client.post(
      "/api/auth/register",
      {
        phone: data.phone,
        password: data.password,
        name: data.name,
        language: data.language || "en",
      },
      { skipAuthExpired: true },
    )
    return response.data.user || response.data
  } catch (error) {
    const message = error.response?.data?.error || "auth.registrationFailed"
    throw new Error(message, { cause: error })
  }
}

export async function sendOtp(phone) {
  if (!hasApiBackend()) {
    return mockSendOtp(phone)
  }
  try {
    await client.post("/api/auth/send-otp", { phone })
    return { success: true }
  } catch (error) {
    if (error.response?.status === 429) throw new Error("auth.otpRateLimit", { cause: error })
    throw new Error(error.response?.data?.error || "ui.error", { cause: error })
  }
}

export async function verifyOTP(phone, code) {
  if (!hasApiBackend()) {
    return mockVerifyOTP(phone, code)
  }
  try {
    const response = await client.post("/api/auth/verify-otp", { phone, code })
    return response.data.user || response.data
  } catch (error) {
    if (error.response?.status === 400) throw new Error("auth.invalidOtp", { cause: error })
    throw new Error(error.response?.data?.error || "ui.error", { cause: error })
  }
}

export async function resetPassword(phone, code, newPassword) {
  if (!hasApiBackend()) {
    return mockVerifyOTP(phone, code) // Mocking the same response as verifyOTP
  }
  try {
    const response = await client.put("/api/auth/reset-password", { phone, code, newPassword })
    return response.data
  } catch (error) {
    if (error.response?.status === 400) throw new Error("auth.invalidOtp", { cause: error })
    throw new Error(error.response?.data?.error || "ui.error", { cause: error })
  }
}

export async function getProfile() {
  if (!hasApiBackend()) {
    return readStorage(STORAGE_KEYS.authUser, null)
  }
  try {
    const response = await client.get("/api/auth/me", { skipAuthRefresh: true, skipAuthExpired: true })
    return response.data
  } catch {
    return null
  }
}

export async function refreshTokens() {
  if (hasApiBackend()) {
    const response = await client.post("/api/auth/refresh", null, {
      skipAuthRefresh: true,
      skipAuthExpired: true,
    })
    return response.data
  }
  return { user: readStorage(STORAGE_KEYS.authUser, null) }
}
