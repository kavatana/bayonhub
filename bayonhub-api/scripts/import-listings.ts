#!/usr/bin/env tsx
// Usage: tsx scripts/import-listings.ts ./data/listings.csv

import fs from "fs"

const CSV_PATH = process.argv[2]
if (!CSV_PATH) {
  console.error("Usage: tsx scripts/import-listings.ts <path-to-csv>")
  process.exit(1)
}

const API_URL = process.env.API_URL || "http://localhost:4000"
const ADMIN_PHONE = process.env.ADMIN_PHONE || "+85512345678"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234"

function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    const next = input[index + 1]
    if (char === "\"" && quoted && next === "\"") {
      field += "\""
      index += 1
    } else if (char === "\"") {
      quoted = !quoted
    } else if (char === "," && !quoted) {
      row.push(field)
      field = ""
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1
      row.push(field)
      if (row.some((value) => value.length > 0)) rows.push(row)
      row = []
      field = ""
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const [headers = [], ...records] = rows
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), record[index]?.trim() || ""])),
  )
}

function toListing(row: Record<string, string>) {
  const facets: Record<string, string | number> = {}
  ;["make", "model", "year"].forEach((name) => {
    const value = row[`facet_${name}`]
    if (value) facets[name] = name === "year" ? Number(value) : value
  })

  return {
    title: row.title,
    titleKm: row.titleKm || undefined,
    description: row.description,
    price: Number(row.price),
    currency: row.currency === "KHR" ? "KHR" : "USD",
    categorySlug: row.categorySlug,
    subcategorySlug: row.subcategorySlug || undefined,
    province: row.province,
    district: row.district || undefined,
    condition: row.condition,
    images: [row.imageUrl1, row.imageUrl2, row.imageUrl3].filter(Boolean),
    sellerName: row.sellerName,
    sellerPhone: row.sellerPhone,
    facets: Object.keys(facets).length ? facets : undefined,
  }
}

async function main() {
  const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: ADMIN_PHONE, password: ADMIN_PASSWORD }),
  })
  if (!loginResponse.ok) {
    throw new Error(`Admin login failed: ${loginResponse.status} ${await loginResponse.text()}`)
  }
  const cookie = loginResponse.headers.getSetCookie?.().join("; ") || loginResponse.headers.get("set-cookie") || ""
  if (!cookie) throw new Error("Admin login did not return an auth cookie")

  const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8"))
  const listings = rows.map(toListing)
  let imported = 0
  let failed = 0

  for (let index = 0; index < listings.length; index += 20) {
    const batch = listings.slice(index, index + 20)
    const response = await fetch(`${API_URL}/api/admin/listings/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ listings: batch }),
    })
    if (!response.ok) {
      failed += batch.length
      console.error(`Batch ${index / 20 + 1} failed: ${response.status} ${await response.text()}`)
      continue
    }
    const result = await response.json()
    imported += Number(result.imported || 0)
    failed += Number(result.failed || 0)
    console.info(`Batch ${index / 20 + 1}: imported=${result.imported} failed=${result.failed}`)
    if (result.errors?.length) console.info(JSON.stringify(result.errors, null, 2))
  }

  console.info(`Done: imported=${imported} failed=${failed}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
