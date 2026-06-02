# BayonHub - Cambodian Classifieds Marketplace

BayonHub is a modern, high-performance classifieds marketplace tailored for the Cambodian market. It offers a fully localized (Khmer/English) experience, robust map integration, seamless payments via ABA KHQR, and a responsive mobile-first PWA design.

## Features

- **Full-Stack Architecture**: React 19 + Node.js/Express backend powered by PostgreSQL and Prisma.
- **Bilingual Interface**: Native support for English and Khmer with dynamic string switching.
- **Real-Time Features**: WebSockets for messaging and notifications via Socket.io.
- **Location & Mapping**: Integrated Leaflet maps for province/district filtering.
- **Monetization & Payments**: Free and Plus subscription tiers, with ABA KHQR integration.
- **Admin & Security**: Secure admin panel with 2FA protection, IP allowlisting, and detailed audit logging.
- **Performance Optimized**: Lazy-loading, optimized chunking, and PostgreSQL trigram text search.

## Tech Stack

**Frontend (bayonhub-app)**
- React 19, Vite 5, React Router v6
- Tailwind CSS v3, GSAP 3, React Three Fiber
- Zustand (State Management)
- Axios, Socket.io-client, vite-plugin-pwa

**Backend (bayonhub-api)**
- Node.js 20, Express 5
- PostgreSQL 16, Prisma ORM
- Redis (Session/Rate Limiting/OTP)
- Cloudflare R2 (S3-compatible Object Storage)
- JWT Auth, Twilio OTP

## Getting Started

### Prerequisites
- Node.js >= 20.x
- Docker (for PostgreSQL and Redis)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/bayonhub.git
cd bayonhub
```

### 2. Environment Setup
Both the frontend and backend require environment variables.
```bash
# Backend setup
cd bayonhub-api
cp .env.example .env
# Edit .env and ensure DATABASE_URL and REDIS_URL are set

# Frontend setup
cd ../bayonhub-app
cp .env.example .env.local
```

### 3. Start Database and Redis
A docker-compose file is provided at the root for local development.
```bash
cd ..
docker compose up -d
```

### 4. Install Dependencies & Seed Database
```bash
# Backend
cd bayonhub-api
npm install
npx prisma db push
npx prisma db seed # Seeds 60 sample listings, users, and stores

# Frontend
cd ../bayonhub-app
npm install
```

### 5. Run the Application
```bash
# Run backend (from bayonhub-api)
npm run dev

# Run frontend (from bayonhub-app)
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:4000`.

## Architecture Rules

BayonHub follows strict architectural guidelines to ensure scalability and maintainability:
- **Global State**: Zustand stores exclusively (no Redux/React Context for global data).
- **Styling**: Tailwind utility classes only. No inline styles except dynamic GSAP values.
- **Translations**: Custom `useTranslation` hook reading from `src/lib/translations.js`.
- **Data Fetching**: Axios instance with built-in localStorage fallbacks for offline-first resilience.
- **Image Processing**: Client-side compression before any backend upload.

## Deployment

The project is fully prepared for a 100% free serverless deployment, ideal for portfolio showcases:
- **Frontend**: Cloudflare Pages (Free Tier)
- **Backend**: Render Web Service (Free Tier)
- **Database**: Neon.tech Serverless Postgres (Free Tier)
- **Cache**: Upstash Serverless Redis (Free Tier)

Please refer to `DEPLOY.md` for complete step-by-step deployment instructions using these free providers.
