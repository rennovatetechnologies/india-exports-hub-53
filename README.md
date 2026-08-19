# VIRASTRA by New India Export — frontend

Vite + React SPA for the VIRASTRA by New India Export customer and ops dashboards.

Lives under **`INDIA EXPORTS/`** next to `new-india-exports` (backend) and `shared` (API contract).

## Connect to the backend

This app talks to **`new-india-exports`** over `/api` (sibling folder).

| Service | Default | Notes |
|---------|---------|--------|
| Frontend | `http://localhost:5173` | `npm run dev` |
| Backend | `http://127.0.0.1:5001` | Vite proxies `/api` → `:5001` |
| MongoDB | `mongodb://127.0.0.1:27017` | Required by the backend |

### 1. Start MongoDB

Backend `.env` expects a local MongoDB (see `new-india-exports/.env.example`).

### 2. Start the API

```bash
cd ../new-india-exports
# prefer the working venv if present
source .venv1/bin/activate   # or: python3 -m venv .venv && pip install -r requirements.txt
cp -n .env.example .env      # fill MONGODB_URI / JWT_SECRET if needed
uvicorn app:app --host 0.0.0.0 --port 5001
```

Health check: [http://127.0.0.1:5001/](http://127.0.0.1:5001/)  
Swagger (dev): [http://127.0.0.1:5001/docs](http://127.0.0.1:5001/docs)

### 3. Start this frontend

```bash
npm install
cp -n .env.example .env.local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Auth is **email + OTP** against `/api/auth/otp/*`. In development, OTP codes are logged on the **backend** console as `[DEV OTP]`.

**Seeded admin (after backend seed):** `sanjay.r@newindiaexport.com` via `/admin/login`.

**Customers:** sign up at `/signup` with any email, then verify with the OTP from the backend logs.

### Demo UI without backend

Set `VITE_ALLOW_AUTH_MOCK=true` in `.env.local` (already set if you copied from this README flow). Restart Vite, then open `/login` or `/admin/login` — a **Demo mode** panel lets you jump in as:

| Persona | Lands on |
|---------|----------|
| Customer (KYC done) | `/dashboard` |
| Customer · KYC | `/dashboard/kyc` |
| Operations | `/admin` |
| Admin | `/admin/platform` |

No OTP or API required. Pages that need live data fall back to local seed catalogs.
## Scripts

```bash
npm run dev      # Vite on :5173
npm run build
npm run preview
npm run lint
```
