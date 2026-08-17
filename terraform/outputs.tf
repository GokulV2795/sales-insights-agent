output "vm_external_ip" {
  description = "Static external IP of the VM"
  value       = google_compute_address.vm_ip.address
}

output "frontend_url" {
  description = "URL of the deployed frontend"
  value       = "http://${google_compute_address.vm_ip.address}"
}

output "backend_url" {
  description = "URL of the deployed backend API"
  value       = "http://${google_compute_address.vm_ip.address}:8000"
}

output "ssh_command" {
  description = "Command to SSH into the VM via IAP (no public SSH access)"
  value       = "gcloud compute ssh ${var.instance_name} --zone=${var.zone} --tunnel-through-iap --project=${var.project_id}"
}
