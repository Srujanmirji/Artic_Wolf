# Aagam AI Implementation Plan

## 1. Project Planning & Setup
- [x] Read and integrate Vibe Coding Checklist
- [x] Initialize project directories (`frontend`, `backend`)
- [x] Create `supabase.sql` schema and RLS policies

## 2. Backend Initialization
- [x] Setup `package.json`, `tsconfig.json`
- [x] Configure `.env`
- [x] Setup Express server and basic routes structure
- [x] Setup Supabase client

## 3. Backend Core Features
- [x] `POST /api/sales/upload`: Inventory Upload
- [x] `POST /api/forecast/run`: Run Forecast (Exponential Smoothing)
- [x] `/api/inventory/metrics`: Safety stock calculator and saving metrics
- [x] `/api/recommendations`: Get Recommendations (Rule based)
- [x] `GET /api/news/latest`: News fetch job stub and sentiment call stub
- [x] `POST /api/sync`: Server sync endpoint for offline queuing

## 4. Frontend Initialization
- [x] Setup Next.js 14 app (`npx create-next-app`)
- [x] Configure Tailwind, shadcn/ui
- [x] Configure `next-pwa` and Service Worker
- [x] Setup `.env.local`

## 5. Frontend Offline Strategy & Logic
- [x] Setup `idb` helper module (`cached_data`, `pending_changes`)
- [x] Implement offline sync hook (`syncPending`) & listener
- [x] `useAuth`, `useInventory` etc custom hooks

## 6. Frontend UI
- [x] Login screen (Supabase auth integration)
- [x] Dashboard (Metrics display)
- [x] Sales CSV upload UI (writes to offline queue / backend)
- [x] News/Scenario UI stub

## 7. Scripts & Documentation
- [x] Demo Data Generator script (`generateSampleData.ts`)
- [x] Write `README.md` with run steps and demo instructions
