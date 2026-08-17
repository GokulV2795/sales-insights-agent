variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone for the VM"
  type        = string
  default     = "us-central1-a"
}

variable "machine_type" {
  description = "GCE machine type. e2-micro is free-tier eligible in us-central1/us-west1/us-east1."
  type        = string
  default     = "e2-micro"
}

variable "instance_name" {
  description = "Name of the GCE VM instance"
  type        = string
  default     = "sales-insights-vm"
}

variable "artifact_repo_id" {
  description = "Artifact Registry repository ID for app images"
  type        = string
  default     = "sales-insights"
}

variable "ssh_source_ranges" {
  description = "CIDR ranges allowed to SSH (default: Google's IAP TCP forwarding range only)"
  type        = list(string)
  default     = ["35.235.240.0/20"]
}

variable "openrouter_api_key" {
  description = "OpenRouter API key"
  type        = string
  sensitive   = true
}

variable "openrouter_model" {
  description = "OpenRouter model id"
  type        = string
  default     = "anthropic/claude-haiku-4.5"
}

variable "openrouter_site_url" {
  description = "OpenRouter site URL header"
  type        = string
  default     = "http://localhost"
}

variable "openrouter_site_name" {
  description = "OpenRouter site name header"
  type        = string
  default     = "Sales_Report"
}
