import "dotenv/config"

type Status = "PASS" | "FAIL" | "SKIPPED"

function print(name: string, status: Status, detail = "") {
  console.log(`${status} ${name}${detail ? ` - ${detail}` : ""}`)
}

function baseUrl() {
  return (process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/+$/, "")
}

async function getCheck(path: string) {
  try {
    const response = await fetch(`${baseUrl()}${path}`)
    print(`GET ${path}`, response.ok ? "PASS" : "FAIL", response.ok ? "" : `status ${response.status}`)
    return response.ok
  } catch {
    print(`GET ${path}`, "FAIL", "request failed")
    return false
  }
}

async function authCheck() {
  if (!process.env.TEST_USER_PHONE || !process.env.TEST_USER_PASSWORD) {
    print("auth login", "SKIPPED", "missing TEST_USER_PHONE or TEST_USER_PASSWORD")
    return true
  }
  try {
    const response = await fetch(`${baseUrl()}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: process.env.TEST_USER_PHONE, password: process.env.TEST_USER_PASSWORD }),
    })
    print("auth login", response.ok ? "PASS" : "FAIL", response.ok ? "" : `status ${response.status}`)
    return response.ok
  } catch {
    print("auth login", "FAIL", "request failed")
    return false
  }
}

async function adminCheck() {
  if (!process.env.ADMIN_TEST_TOKEN) {
    print("admin endpoint", "SKIPPED", "missing ADMIN_TEST_TOKEN")
    return true
  }
  try {
    const response = await fetch(`${baseUrl()}/api/admin/dashboard`, {
      headers: { authorization: `Bearer ${process.env.ADMIN_TEST_TOKEN}` },
    })
    print("admin endpoint", response.ok ? "PASS" : "FAIL", response.ok ? "" : `status ${response.status}`)
    return response.ok
  } catch {
    print("admin endpoint", "FAIL", "request failed")
    return false
  }
}

async function main() {
  const checks = await Promise.all([
    getCheck("/health"),
    getCheck("/api/listings"),
    getCheck("/api/listings/featured"),
    getCheck("/api/search/suggestions?q=test"),
    authCheck(),
    adminCheck(),
  ])
  if (checks.some((value) => !value)) process.exit(1)
}

main().catch(() => {
  print("smoke", "FAIL", "unexpected error")
  process.exit(1)
})
