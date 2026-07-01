# ================================================================
#  SSM Parameter Store — Lưu secrets thay vì hardcode plaintext
#
#  Luồng hoạt động:
#  1. Terraform tạo các parameter này với type "SecureString"
#     (mã hoá bằng KMS key mặc định "alias/aws/ssm" của AWS, miễn phí).
#  2. ECS Task Execution Role (ecs.tf) được cấp quyền ssm:GetParameters +
#     kms:Decrypt trên đúng các parameter/key này.
#  3. Khi container khởi động, ECS Agent tự động gọi SSM, giải mã giá trị,
#     và inject vào container dưới dạng biến môi trường — ứng dụng Spring Boot
#     không biết gì khác, vẫn đọc qua ${DB_PASSWORD} như bình thường.
#     Điểm khác biệt: giá trị KHÔNG còn nằm trong task definition dạng plaintext
#     (trước đây ai xem được task definition qua console/CLI là thấy password).
# ================================================================

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/db_password"
  type  = "SecureString"
  value = var.db_password
  tags  = { Name = "${var.project_name}-db-password" }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.project_name}/jwt_secret"
  type  = "SecureString"
  value = var.jwt_secret
  tags  = { Name = "${var.project_name}-jwt-secret" }
}

resource "aws_ssm_parameter" "mail_password" {
  name  = "/${var.project_name}/mail_password"
  type  = "SecureString"
  value = var.mail_password
  tags  = { Name = "${var.project_name}-mail-password" }
}
