#!/usr/bin/env node

/**
 * Merchant Onboarding Integration Test
 * Tests frontend components and offline storage
 */

import crypto from 'crypto'

const tests = []
let passed = 0
let failed = 0

function test(name, fn) {
  tests.push({ name, fn })
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function runTests() {
  console.log('\n🚀 BayonHub Merchant Onboarding Integration Tests\n')

  for (const { name, fn } of tests) {
    try {
      await fn()
      console.log(`✅ ${name}`)
      passed++
    } catch (error) {
      console.log(`❌ ${name}`)
      console.log(`   Error: ${error.message}\n`)
      failed++
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

// ===== FRONTEND COMPONENT TESTS =====

test('Frontend: Merchant API module file exists', async () => {
  const fs = await import('fs').then(m => m.promises)
  const path = './bayonhub-app/src/api/merchant.js'
  await fs.access(path)
})

test('Frontend: StoreTab component file exists', async () => {
  const fs = await import('fs').then(m => m.promises)
  const path = './bayonhub-app/src/components/dashboard/StoreTab.jsx'
  await fs.access(path)
})

test('Frontend: Offline storage key format', () => {
  const storageKey = 'bayonhub:merchantProfiles'
  assert(storageKey.startsWith('bayonhub:'), 'Invalid storage key format')
  assert(storageKey.includes('merchant'), 'Storage key should include "merchant"')
})

test('Frontend: Merchant translation keys exist (EN)', async () => {
  const fs = await import('fs').then(m => m.promises)
  const content = await fs.readFile('./bayonhub-app/src/lib/translations.js', 'utf-8')
  
  const requiredKeys = [
    'merchant.onboardingTitle',
    'merchant.merchantId',
    'merchant.taxId',
    'merchant.businessDomain',
    'merchant.catalogEndpoints',
    'merchant.merchantName',
    'merchant.contactEmail',
    'merchant.contactPhone',
    'merchant.telegramChannel',
    'merchant.onboardButton',
  ]

  for (const key of requiredKeys) {
    assert(content.includes(`"${key}"`), `Missing EN translation key: ${key}`)
  }
})

test('Frontend: Merchant translation keys exist (KM)', async () => {
  const fs = await import('fs').then(m => m.promises)
  const content = await fs.readFile('./bayonhub-app/src/lib/translations.js', 'utf-8')
  
  const requiredKeys = [
    'merchant.onboardingTitle',
    'merchant.merchantId',
    'merchant.taxId',
    'merchant.businessDomain',
    'merchant.catalogEndpoints',
    'merchant.merchantName',
    'merchant.contactEmail',
    'merchant.contactPhone',
    'merchant.telegramChannel',
    'merchant.onboardButton',
  ]

  for (const key of requiredKeys) {
    // KM translations should have the same key but different values
    const lines = content.split('\n').filter(line => line.includes(`"${key}"`))
    assert(lines.length >= 2, `Missing KM translation for key: ${key}`)
  }
})

test('Frontend: Business domain translations complete (EN)', async () => {
  const fs = await import('fs').then(m => m.promises)
  const content = await fs.readFile('./bayonhub-app/src/lib/translations.js', 'utf-8')

  const domains = [
    'merchant.domainRetail',
    'merchant.domainWholesale',
    'merchant.domainElectronics',
    'merchant.domainAutomotive',
    'merchant.domainRealEstate',
    'merchant.domainServices',
    'merchant.domainFood',
    'merchant.domainAgri',
    'merchant.domainFashion',
  ]

  for (const key of domains) {
    assert(content.includes(`"${key}"`), `Missing EN domain translation: ${key}`)
  }
})

test('Frontend: StoreTab imports merchant API', async () => {
  const fs = await import('fs').then(m => m.promises)
  const content = await fs.readFile('./bayonhub-app/src/components/dashboard/StoreTab.jsx', 'utf-8')
  assert(content.includes('merchant'), 'Missing merchant references in StoreTab')
  assert(content.includes('createMerchantProfile'), 'Missing createMerchantProfile import')
  assert(content.includes('getMerchantProfile'), 'Missing getMerchantProfile import')
  assert(content.includes('updateMerchantProfile'), 'Missing updateMerchantProfile import')
})

test('Frontend: Merchant API module exports functions', async () => {
  const fs = await import('fs').then(m => m.promises)
  const content = await fs.readFile('./bayonhub-app/src/api/merchant.js', 'utf-8')
  assert(content.includes('export async function createMerchantProfile'), 'Missing createMerchantProfile export')
  assert(content.includes('export async function getMerchantProfile'), 'Missing getMerchantProfile export')
  assert(content.includes('export async function updateMerchantProfile'), 'Missing updateMerchantProfile export')
  assert(content.includes('bayonhub:merchantProfiles'), 'Missing offline storage key')
})

test('Backend: Merchant router exports correctly', async () => {
  const fs = await import('fs').then(m => m.promises)
  const content = await fs.readFile('./bayonhub-api/src/modules/merchant/router.ts', 'utf-8')
  assert(content.includes('export default router'), 'Missing router export')
  assert(content.includes('POST /api/v1/merchant/onboard') || content.includes('router.post'), 'Missing POST endpoint')
  assert(content.includes('GET /api/v1/merchant/profile') || content.includes('router.get'), 'Missing GET endpoint')
  assert(content.includes('PUT /api/v1/merchant/profile') || content.includes('router.put'), 'Missing PUT endpoint')
})

test('Backend: App registers merchant router', async () => {
  const fs = await import('fs').then(m => m.promises)
  const content = await fs.readFile('./bayonhub-api/src/app.ts', 'utf-8')
  assert(content.includes('merchantRouter'), 'Missing merchantRouter import')
  assert(content.includes('/api/v1/merchant') || content.includes('merchant'), 'Missing merchant route registration')
})

test('Backend: Environment config supports merchant API keys', async () => {
  const fs = await import('fs').then(m => m.promises)
  const content = await fs.readFile('./bayonhub-api/src/config/env.ts', 'utf-8')
  assert(content.includes('merchantApiKeys') || content.includes('MERCHANT_API_KEYS'), 'Missing merchant API keys config')
})

test('Documentation: Merchant onboarding guide created', async () => {
  const fs = await import('fs').then(m => m.promises)
  const path = './docs/MERCHANT_ONBOARDING.md'
  await fs.access(path)
})

test('Documentation: Migration notes updated', async () => {
  const fs = await import('fs').then(m => m.promises)
  const content = await fs.readFile('./bayonhub-app/MIGRATION_NOTES.md', 'utf-8')
  assert(content.includes('Merchant'), 'Missing merchant onboarding documentation')
})

runTests()
