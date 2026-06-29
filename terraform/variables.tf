# ================================================================
#  Variables
# ================================================================

variable "aws_region" {
  default     = "ap-northeast-1"
  description = "AWS Region"
}

variable "aws_account_id" {
  default     = "197826770971"
  description = "AWS Account ID"
}

variable "project_name" {
  default     = "thermal-power-plant"
  description = "Tên project (dùng làm prefix cho tất cả resource)"
}

# ── Database ─────────────────────────────────────────────────────
variable "db_name" {
  default     = "m6_thermal_power_plant"
  description = "Tên database MySQL"
}

variable "db_username" {
  default     = "admin"
  description = "MySQL master username"
}

variable "db_password" {
  description = "MySQL master password (điền trong terraform.tfvars)"
  sensitive   = true
}

# ── Application ──────────────────────────────────────────────────
variable "jwt_secret" {
  description = "JWT Base64 secret"
  sensitive   = true
  default     = "eWVsbG93d29vZGVub3JnYW5pemVkZGlzdGFuY2Vkcml2aW5nbGVhZGJyYXNzYnJlYXQ="
}

variable "mail_username" {
  description = "Gmail address dùng để gửi email"
  default     = ""
}

variable "mail_password" {
  description = "Gmail App Password"
  sensitive   = true
  default     = ""
}

# ── ECS ──────────────────────────────────────────────────────────
variable "api_cpu" {
  default     = 512
  description = "CPU units cho ECS task (512 = 0.5 vCPU)"
}

variable "api_memory" {
  default     = 1024
  description = "Memory MB cho ECS task"
}

variable "api_desired_count" {
  default     = 1
  description = "Số lượng task ECS chạy song song"
}
