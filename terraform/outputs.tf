# ================================================================
#  Outputs — Thông tin cần lưu lại để dùng trong GitLab CI/CD
# ================================================================

output "ecr_api_url" {
  value       = aws_ecr_repository.api.repository_url
  description = "ECR URL cho backend API → AWS_ECR_API_REPO"
}

output "ecr_frontend_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "ECR URL cho frontend → AWS_ECR_FRONTEND_REPO"
}

output "rds_endpoint" {
  value       = aws_db_instance.mysql.endpoint
  description = "RDS endpoint (host:port) → dùng để build DB_URL"
}

output "rds_db_url" {
  value       = "jdbc:mysql://${aws_db_instance.mysql.endpoint}/${var.db_name}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh"
  description = "DB_URL hoàn chỉnh → điền vào GitLab Variable DB_URL"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "ECS Cluster name → ECS_CLUSTER"
}

output "ecs_service_name" {
  value       = aws_ecs_service.api.name
  description = "ECS Service name → ECS_SERVICE"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.id
  description = "S3 bucket name → S3_BUCKET"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.frontend.id
  description = "CloudFront Distribution ID → CLOUDFRONT_DISTRIBUTION_ID"
}

output "cloudfront_url" {
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  description = "URL public của frontend"
}

output "api_public_ip_info" {
  value       = "Xem IP container trong ECS Console → Tasks → tab Networking"
  description = "Backend không có fixed IP vì dùng Fargate"
}
