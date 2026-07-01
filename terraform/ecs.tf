# ================================================================
#  ECS — Fargate Cluster + Task Definition + Service
# ================================================================

# ── IAM Role cho ECS Task Execution ─────────────────────────────
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Thêm quyền tạo CloudWatch Log Groups
resource "aws_iam_role_policy" "ecs_cloudwatch" {
  name = "cloudwatch-logs"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "*"
    }]
  })
}

# ── CloudWatch Log Group ─────────────────────────────────────────
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}-api"
  retention_in_days = 7   # Giữ log 7 ngày (tiết kiệm chi phí)
}

# ── ECS Cluster ──────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled"   # Tắt để tiết kiệm chi phí
  }

  tags = { Name = "${var.project_name}-cluster" }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# ── Task Definition ──────────────────────────────────────────────
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.project_name}-api:latest"
    essential = true

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    environment = [
      {
        name  = "DB_URL"
        value = "jdbc:mysql://${aws_db_instance.mysql.endpoint}/${var.db_name}?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh"
      },
      { name = "DB_USERNAME",    value = var.db_username },
      { name = "DB_PASSWORD",    value = var.db_password },
      { name = "JWT_SECRET",     value = var.jwt_secret },
      { name = "MAIL_USERNAME",  value = var.mail_username },
      { name = "MAIL_PASSWORD",  value = var.mail_password },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"]
      interval    = 30
      timeout     = 10
      retries     = 3
      startPeriod = 120   # Spring Boot cần ~90s để start
    }
  }])

  tags = { Name = "${var.project_name}-api-task" }
}

# ── ECS Service ──────────────────────────────────────────────────
resource "aws_ecs_service" "api" {
  name                               = "${var.project_name}-api-service"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.api.arn
  desired_count                      = var.api_desired_count
  launch_type                        = "FARGATE"
  health_check_grace_period_seconds  = 120

  network_configuration {
    subnets          = [aws_subnet.public_1.id, aws_subnet.public_2.id]
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true   # Cần để container pull image từ ECR
  }

  # Ignore changes to task definition khi CI/CD deploy image mới
  lifecycle {
    ignore_changes = [task_definition]
  }

  depends_on = [aws_iam_role_policy_attachment.ecs_task_execution]

  tags = { Name = "${var.project_name}-api-service" }
}
