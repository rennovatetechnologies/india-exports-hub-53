# New India Export — frontend

Vite + React SPA for the New India Export customer and ops dashboards.

## Connect to the backend

This app talks to **`new-india-exports`** (FastAPI) over `/api`.

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

Set `VITE_ALLOW_AUTH_MOCK=true` only if you need the old offline OTP mock (no JWT / no DB).

## Scripts

```bash
npm run dev      # Vite on :5173
npm run build
npm run preview
npm run lint
```
