#!/usr/bin/env bash
# One-time setup: creates a GCP service account + Workload Identity
# Federation pool/provider scoped to a single GitHub repo, so GitHub Actions
# can deploy to Cloud Run without any stored long-lived key.
#
# Usage: GITHUB_REPO=your-org/your-repo ./deployment/setup-workload-identity.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/backend/.env"

if [[ -z "${GITHUB_REPO:-}" ]]; then
  echo "Set GITHUB_REPO=owner/repo before running this script." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID not set in backend/.env}"
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

POOL_ID="github-pool"
PROVIDER_ID="github-provider"
SA_NAME="github-actions-deployer"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Project: $PROJECT_ID ($PROJECT_NUMBER)"
echo "GitHub repo: $GITHUB_REPO"
echo ""

echo "1/5 Enabling required APIs..."
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com \
  --project="$PROJECT_ID"

echo "2/5 Creating deployer service account (if missing)..."
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="GitHub Actions Cloud Run deployer"
fi

echo "3/5 Granting deploy roles to the service account..."
for ROLE in roles/run.admin roles/iam.serviceAccountUser roles/cloudbuild.builds.editor \
            roles/artifactregistry.writer roles/storage.admin; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE" \
    --condition=None \
    --quiet >/dev/null
done

echo "4/5 Creating Workload Identity Pool + Provider (if missing)..."
if ! gcloud iam workload-identity-pools describe "$POOL_ID" \
    --project="$PROJECT_ID" --location="global" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --project="$PROJECT_ID" --location="global" \
    --display-name="GitHub Actions pool"
fi

if ! gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
    --project="$PROJECT_ID" --location="global" --workload-identity-pool="$POOL_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --project="$PROJECT_ID" --location="global" --workload-identity-pool="$POOL_ID" \
    --display-name="GitHub provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='${GITHUB_REPO}'" \
    --issuer-uri="https://token.actions.githubusercontent.com"
else
  # Provider already existed (e.g. from a prior run against a different repo) —
  # make sure its attribute-condition still matches the repo we were given.
  gcloud iam workload-identity-pools providers update-oidc "$PROVIDER_ID" \
    --project="$PROJECT_ID" --location="global" --workload-identity-pool="$POOL_ID" \
    --attribute-condition="assertion.repository=='${GITHUB_REPO}'"
fi

echo "5/5 Allowing the GitHub repo to impersonate the service account..."
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project="$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_REPO}" \
  --quiet >/dev/null

WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

echo ""
echo "Done. Set these as GitHub repo variables/secrets:"
echo ""
echo "  gh variable set GCP_PROJECT_ID       --body \"$PROJECT_ID\""
echo "  gh variable set WIF_PROVIDER         --body \"$WIF_PROVIDER\""
echo "  gh variable set WIF_SERVICE_ACCOUNT  --body \"$SA_EMAIL\""
echo "  gh variable set OPENROUTER_MODEL     --body \"$OPENROUTER_MODEL\""
echo "  gh variable set OPENROUTER_SITE_URL  --body \"$OPENROUTER_SITE_URL\""
echo "  gh variable set OPENROUTER_SITE_NAME --body \"$OPENROUTER_SITE_NAME\""
echo "  gh secret set   OPENROUTER_API_KEY   --body \"\$OPENROUTER_API_KEY\""
