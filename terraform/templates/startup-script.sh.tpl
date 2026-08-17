#!/bin/bash
# Runs on every boot (Container-Optimized OS). Pulls the latest built images
# from Artifact Registry and (re)starts both containers.
set -euo pipefail

docker-credential-gcr configure-docker --registries=${region}-docker.pkg.dev

docker pull ${backend_image}
docker pull ${frontend_image}

docker rm -f backend frontend >/dev/null 2>&1 || true

docker run -d --name backend --restart unless-stopped \
  -p 8000:8080 \
  -e OPENROUTER_API_KEY='${openrouter_api_key}' \
  -e OPENROUTER_MODEL='${openrouter_model}' \
  -e OPENROUTER_SITE_URL='${openrouter_site_url}' \
  -e OPENROUTER_SITE_NAME='${openrouter_site_name}' \
  -e GCP_PROJECT_ID='${project_id}' \
  -e CORS_ORIGINS='http://${vm_ip}' \
  ${backend_image}

docker run -d --name frontend --restart unless-stopped \
  -p 80:8080 \
  -e API_BASE_URL='http://${vm_ip}:8000' \
  ${frontend_image}
