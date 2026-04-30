# BayonHub Deployment Guide

## Prerequisites
- GitHub account with this repo pushed
- Railway account (railway.app) — free tier works
- Cloudflare account (cloudflare.com) — free tier works

## Step 1 — Push to GitHub
```bash
cd /Users/user/Vibe-Coding/HTML-CSS-JS/bayonhub02
git remote add origin https://github.com/YOUR_USERNAME/bayonhub.git
git push -u origin main
```

## Step 2 — Deploy Backend on Railway
1. Go to railway.app → New Project → Deploy from GitHub
2. Select your repo → select bayonhub-api/ as root directory
3. Railway will detect the Dockerfile automatically
4. Add environment variables (Settings → Variables):
   - Paste all values from bayonhub-api/.env.production.template
   - Use the JWT secrets generated in Task 2
5. Add Railway PostgreSQL: New → Database → PostgreSQL
   - Railway auto-sets DATABASE_URL
6. Add Railway Redis: New → Database → Redis
   - Railway auto-sets REDIS_URL
7. Deploy → wait for green status
8. Copy your Railway URL: https://bayonhub-api-xxxx.railway.app

## Step 3 — Deploy Frontend on Cloudflare Pages
1. Go to pages.cloudflare.com → Create application → Pages
2. Connect GitHub → select your repo
3. Framework preset: Vite
4. Build command: cd bayonhub-app && npm run build
5. Build output directory: bayonhub-app/dist
6. Environment variables:
   VITE_API_URL=https://bayonhub-api-xxxx.railway.app (from Step 2)
   VITE_SITE_URL=https://bayonhub.com
   VITE_R2_PUBLIC_URL=https://media.bayonhub.com
7. Deploy → wait for green status
8. Custom domain → add bayonhub.com

## Step 4 — Update CORS on Backend
In Railway variables, update:
FRONTEND_URL=https://bayonhub.com

Redeploy backend.

## Step 5 — Verify deployment
curl https://bayonhub-api-xxxx.railway.app/health
→ {"status":"ok","db":"ok","redis":"ok"}

curl https://bayonhub-api-xxxx.railway.app/api/listings
→ JSON with 30 listings

Open https://bayonhub.com in browser
→ Homepage loads with real listings

## Step 6 — When R2 is ready (Cloudflare)
1. cloudflare.com → R2 → Create bucket: bayonhub-media
2. Settings → Public access → Enable
3. Manage API tokens → R2 Token → Create
4. Add to Railway variables:
   R2_ACCOUNT_ID=xxx
   R2_ACCESS_KEY_ID=xxx
   R2_SECRET_ACCESS_KEY=xxx
   R2_BUCKET_NAME=bayonhub-media
   R2_PUBLIC_URL=https://pub-xxx.r2.dev
5. Redeploy backend

## Step 7 — When Twilio is ready
1. twilio.com → sign up → get trial number
2. Add to Railway variables:
   TWILIO_ACCOUNT_SID=xxx
   TWILIO_AUTH_TOKEN=xxx
   TWILIO_PHONE_NUMBER=+1xxx
3. In Twilio console: verify your Cambodia test numbers
4. Redeploy backend

## Step 8 — When ABA KHQR is ready
Contact ABA Bank Cambodia: payway.ababank.com
Timeline: 1-2 weeks for merchant account approval
Until then: KHQR placeholder modal is shown to users
