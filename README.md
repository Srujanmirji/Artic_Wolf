# Aagam AI — Intelligent Inventory Forecasting and Optimization Engine

A production-minded full-stack application for modern supply chain forecasting, featuring an offline-first PWA frontend and an Express/Supabase backend.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui, Recharts, Zustand, next-pwa (IndexedDB).
- **Backend**: Node.js, Express, TypeScript, Supabase Client.
- **Database**: PostgreSQL (Supabase) + Row Level Security (RLS).

## Quick Start & Local Development

### 1. Database Setup (Supabase)
1. Create a new Supabase project.
2. Run the SQL from `supabase.sql` in your Supabase SQL Editor.
3. Grab your `URL`, `anon key`, and `service_role key`.

### 2. Backend Setup
```bash
cd backend
npm install
```
Create `backend/.env` with your Supabase credentials:
```env
PORT=5000
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```
Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Create `frontend/.env.local` with your Supabase credentials and backend URL:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_PWA=true
```
Start the frontend:
```bash
npm run dev
```
Visit `http://localhost:3000`.

## Demo Sequence

### 1. Generate Synthetic Data
Run the generator script in the `backend` directory:
```bash
npx ts-node src/utils/generator.ts
```
Copy the generated `Org ID`.

### 2. Test Forecasting
Using Postman or `curl`, trigger the forecast engine:
```bash
curl -X POST http://localhost:5000/api/forecast/run \
  -H "Content-Type: application/json" \
  -d '{"organization_id":"YOUR_ORG_ID", "product_id":"PRODUCT_ID_FROM_DB", "warehouse_id":"WAREHOUSE_ID_FROM_DB", "period_days":14, "method":"exponential_smoothing"}'
```

### 3. Test Offline Capabilities
1. Go to `http://localhost:3000/dashboard`.
2. Open Chrome DevTools -> Network -> Switch to "Offline".
3. Click "Upload Sales CSV" on the dashboard. You will see an offline queued alert.
4. Switch back to "Online", and the queued request will be processed.
