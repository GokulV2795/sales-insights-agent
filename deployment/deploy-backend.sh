#!/usr/bin/env bash
# Deploys the FastAPI + LangChain backend to Cloud Run.
# Builds remotely via Cloud Build (gcloud run deploy --source), so no local
# Docker daemon is required.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/backend/.env"

SERVICE_NAME="${SERVICE_NAME:-sales-insights-backend}"
REGION="${REGION:-us-central1}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy backend/.env.example to backend/.env and fill in values first." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [[ -z "${GCP_PROJECT_ID:-}" ]]; then
  echo "GCP_PROJECT_ID is not set in backend/.env" >&2
  exit 1
fi

echo "Deploying backend to Cloud Run project=$GCP_PROJECT_ID region=$REGION service=$SERVICE_NAME"

gcloud run deploy "$SERVICE_NAME" \
  --source="$ROOT_DIR/backend" \
  --project="$GCP_PROJECT_ID" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --set-env-vars="OPENROUTER_API_KEY=${OPENROUTER_API_KEY},OPENROUTER_MODEL=${OPENROUTER_MODEL},OPENROUTER_SITE_URL=${OPENROUTER_SITE_URL},OPENROUTER_SITE_NAME=${OPENROUTER_SITE_NAME},GCP_PROJECT_ID=${GCP_PROJECT_ID},CORS_ORIGINS=*"

BACKEND_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --project="$GCP_PROJECT_ID" --region="$REGION" --format='value(status.url)')

echo ""
echo "Backend deployed: $BACKEND_URL"
echo "Next: ./deployment/deploy-frontend.sh"
