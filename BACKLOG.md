# BayonHub Future Upgrades Backlog

Last updated: May 2026

---

## TIER 1 — Revenue Critical (Do First)

### 1. ABA KHQR Real Integration

- Contact: [payway.ababank.com](http://payway.ababank.com/) — apply for merchant account
- What to build: real QR payload generation, webhook verification,
Payment + ListingPromotion Prisma models already exist
- Unlocks: actual revenue, boost ads, top ads
- Estimated effort: 2 weeks after merchant approval

### 2. Twilio SMS OTP

- Get credentials: [twilio.com](http://twilio.com/) (free trial works for Cambodia)
- Code is ready — just fill .env vars
- Unlocks: real user registration, trustworthy auth
- Estimated effort: 30 minutes after credentials

### 3. Cloudflare R2 Image Storage

- Get credentials: Cloudflare dashboard → R2
- Code is ready — just fill .env vars
- Unlocks: images survive Railway redeploys
- Estimated effort: 30 minutes after credentials

---

## TIER 2 — Growth Features (Do After Revenue)

### 4. AI Listing Assistant (Biggest ROI Feature)

- Stack: Anthropic API (claude-sonnet-4-6) from bayonhub-api/
- How it works: seller types 10 words → AI generates full
bilingual KM+EN listing with title, description, price
suggestion, category auto-detection, facets auto-filled
- Cost: ~$0.003 per listing
- Unlocks: removes friction from posting, better listing quality,
higher SEO value per listing
- Spec: POST /api/ai/generate-listing
Body: { rawInput: string, language: 'km'|'en', categoryHint?: string }
Returns: { title, titleKm, description, descriptionKm,
suggestedPrice, categorySlug, facets }

### 5. Telegram Merchant Bot (Zero Cost, High Retention)

- Stack: node-telegram-bot-api (no Twilio needed, free)
- Bot sends instant alerts to seller's Telegram when:
    - Someone views listing 10+ times in 1 hour
    - Phone number is clicked/revealed
    - New chat message received
    - Listing expires in 24 hours
    - Boost promotion expires
    - KYC application approved/rejected
- Setup: Create bot via @BotFather, get token
- Spec: Add telegramChatId field to User model in Prisma
POST /api/telegram/connect — links user to their bot chat

### 6. ABA Pre-Auth Escrow for Vehicles + Property

- The $10M moat feature
- How it works: buyer deposits funds → held in escrow →
seller ships/meets → buyer confirms → funds released
- Khmer24 CANNOT do this easily (legacy architecture)
- BayonHub headline: "Buy a car safely — money held until you're happy"
- Scope: vehicles and house-land categories only at launch
- Requires: ABA merchant account (same as KHQR above)
- Spec: EscrowTransaction Prisma model with states:
INITIATED → FUNDED → ITEM_RECEIVED → COMPLETED | DISPUTED

### 7. Seller Analytics Dashboard

- Spec: GET /api/sellers/me/analytics
Returns: totalViews, totalLeads, viewsThisWeek, leadsThisWeek,
topListings[5], leadsByType{CALL,WHATSAPP,TELEGRAM,CHAT,OFFER}
- Frontend: analytics cards in MyAdsTab above listing table
- "How many people clicked my phone number today" = sticky sellers

---

## TIER 3 — Scale Features (When You Have 10k+ Users)

### 8. Algolia/Typesense Search

- Replace tsvector with dedicated search engine
- Enables: typo tolerance, Khmer text search, instant results
- tsvector is good enough until 50k+ listings

### 9. AI Image Moderation

- Stack: Google Cloud Vision SafeSearch API or Anthropic Vision
- Auto-reject: weapons, adult content, drugs before moderation queue
- Trigger: run on every image upload in processAndUpload()

### 10. Price History Tracking

- Prisma model: ListingPriceHistory { listingId, price, currency, changedAt }
- On every listing price update: insert a history record
- Frontend: small sparkline chart on listing detail showing price over time
- Khmer24 does NOT have this — trust differentiator

### 11. Dynamic OG Image Generation

- Stack: @vercel/og or sharp on the backend
- Generate a 1200x630 PNG for every listing automatically
- Include: listing photo, title, price, BayonHub logo
- Telegram shares become rich cards with real listing photos
- Spec: GET /api/og/listing/:id.png

### 12. FCM Push Notifications (PWA)

- Firebase Cloud Messaging for web push
- Notify buyers: "Price dropped on your saved listing"
- Notify sellers: "Your listing has 50 views today"
- Requires: Firebase project setup

### 13. KYC Automation (OCR)

- Stack: Google Cloud Vision OCR or AWS Textract
- Auto-extract: name, ID number, DOB from uploaded ID photos
- Auto-verify: check extracted name matches registration name
- Reduces admin review time from 24 hours to instant for clean IDs

---

## TIER 4 — Market Dominance (When Profitable)

### 14. Android Native App

- Stack: React Native or Capacitor (reuse existing React code)
- Priority: Android first (Cambodia is 80%+ Android)
- Google Play Store submission

### 15. Google/Facebook/Telegram OAuth

- Social login buttons already exist in AuthModal (UI only)
- Backend: Passport.js strategies for each
- Telegram Login Widget is free and perfect for Cambodia market

### 16. Dealer/Business Subscription Tiers

- Starter (free): 5 active listings
- Pro ($15/month): unlimited listings, analytics, featured store
- Enterprise ($50/month): API access, bulk import, account manager
- Prisma: SubscriptionPlan model with billing cycle

### 17. Loan Calculator Partnership

- Partner with ABA, ACLEDA, or Canadia Bank
- Show real pre-qualification on vehicle listings
- Revenue: referral fee per loan application
- "Get pre-approved in 2 minutes" button on car listings

---

## BACKGROUND ASSETS — Design System Upgrades

### Bayon Temple Sketches (Images 1 + 2 — see files)

Two variants:

- Image 1: Clean line art (high contrast, pure outlines)
- Image 2: Shaded pencil sketch (softer, more texture)

Placement recommendations — see section below.

### Phnom Penh Skyline Silhouette (Image 3 — see files)

Light gray fade-to-white silhouette showing:
Independence Monument, modern towers, Royal Palace, temples

Placement recommendations — see section below.

---

## TECHNICAL DEBT TO CLEAR

- [ ]  Legacy files in project root (Bayonhub02.html etc) — DELETE
- [ ]  Three.js HeroOrb: add 3-second delay on slow/mobile connections
- [ ]  Merchant profiles were in Redis — migrated to PostgreSQL ✅
- [ ]  Local image uploads blocked in production without R2 ✅
- [ ]  Admin seed phone fixed to +85512345678 ✅
- [ ]  All 5 QA waves complete ✅
- [ ]  13/13 pre-deploy checks passing ✅
