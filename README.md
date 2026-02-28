<p align="center">
  <img src="frontend/public/aagam-logo.png" alt="Aagam AI Logo" width="180" />
</p>

<h1 align="center">Aagam AI</h1>
<p align="center">Intelligent Inventory Forecasting and Optimization</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#troubleshooting">Troubleshooting</a>
</p>

Aagam AI is a full-stack supply chain and inventory intelligence platform built with Next.js, Express, and Supabase. It helps teams track inventory, record sales, run forecasts, simulate scenarios, and monitor market intelligence in one dashboard.

## Features
- Inventory management with stock metrics and editable item pricing.
- Sales recording with product selection, quantity input, and history tracking.
- Forecast workflows (`run`, `run-all`) for demand planning.
- Scenario simulation for supply chain what-if analysis.
- Recommendation engine for inventory actions.
- Market intelligence feed with sentiment and impact analysis.
- Transfer optimization support for cross-location balancing.
- Offline-first patterns and sync endpoint for queued operations.

## Tech Stack
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, React Query, Recharts, Zustand.
- Backend: Node.js, Express, TypeScript, Zod, Supabase JS.
- Database: PostgreSQL on Supabase.
- Auth and integrations: Supabase auth, Google OAuth (optional), browser speech APIs for voice actions.

## Project Structure
```text
Aagam_AI/
  backend/        # Express API + business logic
  frontend/       # Next.js app
  supabase.sql    # Database schema and seed baseline
  Logo/           # Branding assets
```

## Quick Start

### 1) Clone and install
```bash
git clone <your-repo-url>
cd Aagam_AI
```

### 2) Database setup (Supabase)
1. Create a Supabase project.
2. Run `supabase.sql` in the Supabase SQL editor.
3. Copy your project URL, anon key, and service role key.

### 3) Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
NODE_ENV=development
```

Run backend:
```bash
npm run dev
```

### 4) Frontend setup
```bash
cd ../frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_ORG_ID=your_org_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=optional_google_oauth_client_id
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Run frontend:
```bash
npm run dev
```

Open http://localhost:3000

## Core API Routes
- Auth: `/api/auth/*`
- Inventory: `/api/inventory/*`
- Sales: `/api/sales/*`
- Forecast: `/api/forecast/*`
- Scenarios: `/api/scenario/*`, `/api/scenarios/*`
- Recommendations: `/api/recommendations/*`
- News and intelligence: `/api/news/*`, `/api/news-impact/*`, `/api/sentiment/*`
- Transfers: `/api/transfer/*`, `/api/transfers/*`
- Dashboard KPIs: `/api/dashboard/*`
- Sync queue: `/api/sync`

Health check: `/health`

## Scripts

### Backend
```bash
npm run dev
npm run build
npm start
```

### Frontend
```bash
npm run dev
npm run build
npm start
npm run lint
```

## Troubleshooting
- `EADDRINUSE: address already in use :::5000`
  - Port 5000 is already occupied. Stop the existing process or change `PORT` in `backend/.env` and update `NEXT_PUBLIC_API_BASE_URL` accordingly.

- `Database connection failed: Supabase is unreachable`
  - Verify `SUPABASE_URL` and keys.
  - Check local network/DNS access.
  - Confirm the Supabase project is active.

- `JSON object requested, multiple (or no) rows returned`
  - A query expected exactly one row but got none or many.
  - Verify seed/setup data for the selected org.
  - Ensure `NEXT_PUBLIC_ORG_ID` points to a valid organization.

- Build error from icon import (example: missing `Waveform`)
  - Use valid exports from `lucide-react` (for example `Waves`).

## Notes
- `frontend/public/aagam-logo.png` is used as the project logo in this README.
- Keep backend and frontend env values aligned to avoid sync and fetch issues.

## License
This project is currently private/proprietary unless you define a license file.
