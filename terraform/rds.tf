# ================================================================
#  RDS — MySQL 8.0 (Free Tier eligible: db.t3.micro + gp2 20GB)
# ================================================================

resource "aws_db_instance" "mysql" {
  identifier        = "${var.project_name}-db"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 3306

  # Networking — dùng VPC mới tạo
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  # Không public: chỉ ECS (trong cùng VPC, qua rds SG) mới kết nối được
  publicly_accessible = false
  skip_final_snapshot = true

  # Multi-AZ vẫn tắt để tiết kiệm chi phí (đồ án, không cần HA)
  multi_az = false
  # Bật backup tự động 7 ngày — trước đây = 0 nghĩa là mất dữ liệu vĩnh viễn nếu RDS lỗi
  backup_retention_period = 7
  deletion_protection     = false

  performance_insights_enabled = false
  monitoring_interval          = 0

  tags = {
    Name    = "${var.project_name}-db"
    Project = var.project_name
  }
}
