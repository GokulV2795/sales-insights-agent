# Sales Insights — LangChain Agent + Dashboard

An end-to-end sales analytics app: a FastAPI + LangChain backend serving a
realistic mock sales dataset, a tool-calling chatbot agent (via OpenRouter),
and a React dashboard/reports frontend. Deploys to Cloud Run on GCP.

## Architecture

```
backend/   FastAPI + SQLAlchemy + SQLite + LangChain agent (OpenRouter LLM)
frontend/  React (Vite) — Dashboard, Chat Assistant, Cumulative Reports
deployment/  Cloud Run deploy scripts (build remotely via Cloud Build)
```

- **Data**: `backend/app/seed_data.py` generates ~13k realistic sales orders
  (5 regions, 16 stores/channels, 6 categories, 42 products, 650 customers)
  spanning Jan 2025–Aug 2026 with seasonality (holiday spike) and ~2.5%
  monthly growth. Seeded deterministically (fixed random seed) so every
  instance/deployment has identical data.
- **Chatbot agent**: `backend/app/agent.py` + `tools.py` — a LangChain
  tool-calling agent with curated aggregation tools (KPIs, trends, top
  products, region/category/channel breakdowns) plus a sandboxed read-only
  SQL tool for open-ended questions. Per-session chat history is kept
  in-memory (fine for a single-instance demo; swap for Redis/Firestore for
  multi-instance production use).
- **Dashboard**: KPI tiles + revenue trend + breakdown charts, backed by
  `/api/dashboard`.
- **Cumulative reports**: `/api/reports/cumulative` computes running
  totals up to a chosen date and has the LLM write an executive summary;
  downloadable as PDF (`/api/reports/cumulative/pdf`).

## Local development

### Backend

```bash
cd backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux
cp .env.example .env   # then fill in OPENROUTER_API_KEY etc.
./.venv/Scripts/python.exe -m app.seed_data      # generate the mock database
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

The API is now at http://localhost:8000 (docs at `/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is now at http://localhost:5173. It talks to the backend via
`VITE_API_BASE_URL` (see `frontend/.env`), default `http://localhost:8000`.

## Deploying to GCP (Cloud Run)

Prerequisites: `gcloud` CLI authenticated (`gcloud auth login`), and the
Cloud Run + Cloud Build + Artifact Registry APIs enabled on your project
(`gcloud services enable run.googleapis.com cloudbuild.googleapis.com
artifactregistry.googleapis.com`).

Both services build **remotely via Cloud Build** (`gcloud run deploy
--source`), so no local Docker install is required.

```bash
# 1. Fill in backend/.env (OPENROUTER_API_KEY, OPENROUTER_MODEL, GCP_PROJECT_ID, ...)

# 2. Deploy the backend
./deployment/deploy-backend.sh

# 3. Deploy the frontend (auto-wires it to the backend URL, then tightens
#    the backend's CORS policy to the frontend's origin)
./deployment/deploy-frontend.sh
```

Override region/service names via env vars, e.g. `REGION=europe-west1
./deployment/deploy-backend.sh`.

**Note on secrets**: the deploy scripts pass `OPENROUTER_API_KEY` via
`--set-env-vars`, which is simple but visible in Cloud Run's console/`gcloud`
output. For production, move it to Secret Manager and reference it with
`--set-secrets` instead.

**Note on data persistence**: SQLite lives inside the container's ephemeral
filesystem — each Cloud Run instance seeds its own identical copy on cold
start (deterministic seed). That's fine for a demo; for real persisted data,
swap `DATABASE_URL` for a Cloud SQL Postgres instance.

## CI/CD (GitHub Actions)

`.github/workflows/deploy-backend.yml` and `deploy-frontend.yml` redeploy
each service to Cloud Run automatically on push to `main` (path-filtered, so
a frontend-only change doesn't rebuild the backend and vice versa). Both can
also be triggered manually via `workflow_dispatch`.

Auth uses **Workload Identity Federation** — no stored GCP key. One-time
setup:

```bash
GITHUB_REPO=your-org/your-repo ./deployment/setup-workload-identity.sh
```

This creates a `github-actions-deployer` service account and a Workload
Identity Pool/Provider scoped to that exact repo, then prints the `gh`
commands to set the resulting values as repo variables/secrets:

- `GCP_PROJECT_ID`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`, `OPENROUTER_MODEL`,
  `OPENROUTER_SITE_URL`, `OPENROUTER_SITE_NAME` — repo **variables**
- `OPENROUTER_API_KEY` — repo **secret**

After that, any push touching `backend/**` or `frontend/**` redeploys the
corresponding Cloud Run service.
