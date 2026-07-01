# ================================================================
#  Outputs — Thông tin cần lưu lại (Jenkins + AWS)
# ================================================================

output "ecr_api_url" {
  value       = aws_ecr_repository.api.repository_url
  description = "ECR URL cho backend API"
}

output "ecr_frontend_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "ECR URL cho frontend"
}

output "rds_endpoint" {
  value       = aws_db_instance.mysql.endpoint
  description = "RDS endpoint (host:port)"
}

output "rds_db_url" {
  value       = "jdbc:mysql://${aws_db_instance.mysql.endpoint}/${var.db_name}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh"
  description = "DB_URL hoàn chỉnh"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "ECS Cluster name"
}

output "ecs_service_name" {
  value       = aws_ecs_service.api.name
  description = "ECS Service name"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.id
  description = "S3 bucket name"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.frontend.id
  description = "CloudFront Distribution ID"
}

output "cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  description = "URL public của frontend"
}

# ── Jenkins ──────────────────────────────────────────────────────
output "jenkins_url" {
  value       = "http://${aws_eip.jenkins.public_ip}:8080"
  description = "Jenkins Web UI URL"
}

output "jenkins_public_ip" {
  value       = aws_eip.jenkins.public_ip
  description = "Jenkins server public IP"
}

output "jenkins_ssh_command" {
  value       = "ssh -i terraform/jenkins-key.pem ec2-user@${aws_eip.jenkins.public_ip}"
  description = "Lệnh SSH vào Jenkins server"
}

output "jenkins_initial_password_command" {
  value       = "ssh -i terraform/jenkins-key.pem ec2-user@${aws_eip.jenkins.public_ip} 'sudo cat /var/lib/jenkins/secrets/initialAdminPassword'"
  description = "Lệnh lấy Jenkins initial admin password"
}
