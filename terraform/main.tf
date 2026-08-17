locals {
  backend_image  = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_repo_id}/backend:latest"
  frontend_image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.artifact_repo_id}/frontend:latest"

  backend_source_files = concat(
    tolist(fileset("${path.module}/..", "backend/app/**")),
    ["backend/requirements.txt", "backend/Dockerfile", "backend/.dockerignore"],
  )
  backend_hash = md5(join("", [for f in local.backend_source_files : filemd5("${path.module}/../${f}")]))

  frontend_source_files = concat(
    tolist(fileset("${path.module}/..", "frontend/src/**")),
    tolist(fileset("${path.module}/..", "frontend/public/**")),
    [
      "frontend/index.html", "frontend/package.json", "frontend/vite.config.js",
      "frontend/Dockerfile", "frontend/nginx.conf", "frontend/docker-entrypoint.sh",
      "frontend/.dockerignore",
    ],
  )
  frontend_hash = md5(join("", [for f in local.frontend_source_files : filemd5("${path.module}/../${f}")]))
}

resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "iap.googleapis.com",
  ])
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = var.artifact_repo_id
  format        = "DOCKER"
  description   = "Sales Insights app images (single-VM deployment)"
  depends_on    = [google_project_service.apis]
}

# --- Build & push images via Cloud Build (rebuilds only when source changes) ---

resource "null_resource" "build_backend_image" {
  triggers = { source_hash = local.backend_hash }
  provisioner "local-exec" {
    command     = "gcloud builds submit --project=${var.project_id} --tag=${local.backend_image} ."
    working_dir = abspath("${path.module}/../backend")
  }
  depends_on = [google_artifact_registry_repository.repo]
}

resource "null_resource" "build_frontend_image" {
  triggers = { source_hash = local.frontend_hash }
  provisioner "local-exec" {
    command     = "gcloud builds submit --project=${var.project_id} --tag=${local.frontend_image} ."
    working_dir = abspath("${path.module}/../frontend")
  }
  depends_on = [google_artifact_registry_repository.repo]
}

# --- VM service account (least privilege: pull images only) ---

resource "google_service_account" "vm_sa" {
  account_id   = "${var.instance_name}-sa"
  display_name = "Sales Insights VM service account"
}

resource "google_project_iam_member" "vm_sa_ar_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.vm_sa.email}"
}

# --- Networking ---

resource "google_compute_address" "vm_ip" {
  name       = "${var.instance_name}-ip"
  region     = var.region
  depends_on = [google_project_service.apis]
}

resource "google_compute_firewall" "allow_http" {
  name          = "${var.instance_name}-allow-http"
  network       = "default"
  direction     = "INGRESS"
  source_ranges = ["0.0.0.0/0"]
  target_tags   = [var.instance_name]

  allow {
    protocol = "tcp"
    ports    = ["80", "8000"]
  }

  depends_on = [google_project_service.apis]
}

resource "google_compute_firewall" "allow_ssh_iap" {
  name          = "${var.instance_name}-allow-ssh-iap"
  network       = "default"
  direction     = "INGRESS"
  source_ranges = var.ssh_source_ranges
  target_tags   = [var.instance_name]

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  depends_on = [google_project_service.apis]
}

# --- VM ---

data "google_compute_image" "cos" {
  family  = "cos-stable"
  project = "cos-cloud"
}

resource "google_compute_instance" "vm" {
  name         = var.instance_name
  machine_type = var.machine_type
  zone         = var.zone
  tags         = [var.instance_name]

  boot_disk {
    initialize_params {
      image = data.google_compute_image.cos.self_link
      size  = 20
      type  = "pd-standard"
    }
  }

  network_interface {
    network = "default"
    access_config {
      nat_ip = google_compute_address.vm_ip.address
    }
  }

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    startup-script = templatefile("${path.module}/templates/startup-script.sh.tpl", {
      region               = var.region
      backend_image        = local.backend_image
      frontend_image       = local.frontend_image
      vm_ip                = google_compute_address.vm_ip.address
      project_id           = var.project_id
      openrouter_api_key   = var.openrouter_api_key
      openrouter_model     = var.openrouter_model
      openrouter_site_url  = var.openrouter_site_url
      openrouter_site_name = var.openrouter_site_name
    })
  }

  allow_stopping_for_update = true

  depends_on = [
    null_resource.build_backend_image,
    null_resource.build_frontend_image,
    google_project_iam_member.vm_sa_ar_reader,
    google_compute_firewall.allow_http,
    google_compute_firewall.allow_ssh_iap,
  ]
}
