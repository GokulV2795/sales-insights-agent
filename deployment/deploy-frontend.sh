#!/usr/bin/env bash
# Deploys the React (Vite) frontend to Cloud Run, wiring it to the backend
# service URL, then tightens the backend's CORS policy to only allow the
# deployed frontend origin.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/backend/.env"

BACKEND_SERVICE="${BACKEND_SERVICE:-sales-insights-backend}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-sales-insights-frontend}"
REGION="${REGION:-us-central1}"

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [[ -z "${GCP_PROJECT_ID:-}" ]]; then
  echo "GCP_PROJECT_ID is not set in backend/.env" >&2
  exit 1
fi

BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
  --project="$GCP_PROJECT_ID" --region="$REGION" --format='value(status.url)' 2>/dev/null || true)

if [[ -z "$BACKEND_URL" ]]; then
  echo "Could not find backend service '$BACKEND_SERVICE'. Run ./deployment/deploy-backend.sh first." >&2
  exit 1
fi

echo "Deploying frontend to Cloud Run, pointing at backend: $BACKEND_URL"

gcloud run deploy "$FRONTEND_SERVICE" \
  --source="$ROOT_DIR/frontend" \
  --project="$GCP_PROJECT_ID" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="API_BASE_URL=${BACKEND_URL}"

FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" \
  --project="$GCP_PROJECT_ID" --region="$REGION" --format='value(status.url)')

echo ""
echo "Frontend deployed: $FRONTEND_URL"
echo "Restricting backend CORS to this origin..."

gcloud run services update "$BACKEND_SERVICE" \
  --project="$GCP_PROJECT_ID" --region="$REGION" \
  --update-env-vars="CORS_ORIGINS=${FRONTEND_URL}"

echo ""
echo "Done."
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
