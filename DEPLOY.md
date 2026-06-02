# BayonHub Deployment Guide (100% Free Tier)

This guide walks you through deploying BayonHub on a fully serverless, $0/month stack tailored for a portfolio.

## Prerequisites
- GitHub account with this repo pushed
- Cloudflare account (cloudflare.com) — Free
- Neon account (neon.tech) — Free Serverless Postgres
- Upstash account (upstash.com) — Free Serverless Redis
- Render account (render.com) — Free Web Service

## Step 1 — Push to GitHub
Ensure your latest code is pushed to the `main` branch.

## Step 2 — Set Up Free Databases
1. **Neon (PostgreSQL)**: 
   - Create a new project on neon.tech.
   - Copy the connection string (`postgres://...`). This is your `DATABASE_URL`.
2. **Upstash (Redis)**:
   - Create a new Redis database on upstash.com.
   - Scroll down to the Node.js connection code and copy the URL (`rediss://...`). This is your `REDIS_URL`.

## Step 3 — Deploy Backend on Render
1. Go to render.com → New → Web Service → Build and deploy from a Git repository.
2. Select your `bayonhub` repo.
3. Configure the service:
   - **Root Directory**: `bayonhub-api`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Add Environment Variables (Advanced):
   - `DATABASE_URL`: (From Neon)
   - `REDIS_URL`: (From Upstash)
   - `JWT_SECRET`: (Generate a random 64-char string)
   - `JWT_REFRESH_SECRET`: (Generate a different 64-char string)
   - `FRONTEND_URL`: `https://bayonhub.com`
   - `FRONTEND_URL_WWW`: `https://www.bayonhub.com`
5. Click **Create Web Service**. Render will build and deploy.
6. Copy your Render URL: `https://bayonhub-api-xxxx.onrender.com`

*Note: Render's free tier spins down after 15 minutes of inactivity. The first request after sleeping will take ~30 seconds to wake the server up.*

## Step 4 — Deploy Frontend on Cloudflare Pages
1. Go to pages.cloudflare.com → Create application → Pages → Connect to Git.
2. Select your `bayonhub` repo.
3. Configure the build settings:
   - **Framework Preset**: `Vite`
   - **Build command**: `cd bayonhub-app && npm run build`
   - **Build output directory**: `bayonhub-app/dist`
4. Add Environment Variables:
   - `VITE_API_URL`: (Your Render URL from Step 3)
   - `VITE_SITE_URL`: `https://bayonhub.com`
   - `VITE_R2_PUBLIC_URL`: `https://media.bayonhub.com`
5. Deploy and add your custom domain (`bayonhub.com`).

## Step 5 — Verify deployment
- Visit `https://bayonhub-api-xxxx.onrender.com/health` → Should return `{"status":"ok","db":"ok","redis":"ok"}`
- Visit `https://bayonhub.com` → Homepage loads.

## Note on SMS (Twilio)
This free deployment bypasses Twilio. The backend is configured to gracefully fall back to printing OTPs into the server logs. During a portfolio review, you can simply view your Render logs to get the 6-digit OTP code when someone tries to sign in with a phone number.

Alternatively, the Telegram bot login feature works perfectly and is 100% free.

## Optional Free Add-ons
- **Media Storage**: Cloudflare R2 (10GB free/month). Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` in Render variables.
- **Emails**: Resend (3,000 free/month). Set `RESEND_API_KEY` in Render variables.
