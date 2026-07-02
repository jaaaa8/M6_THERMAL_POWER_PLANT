# ================================================================
#  Application Load Balancer — đứng trước ECS Fargate
#
#  Lý do cần cái này: mỗi lần ECS Fargate deploy lại (CD chạy), task mới
#  nhận 1 public IP KHÁC — frontend không thể hardcode IP để gọi API.
#  ALB có 1 DNS name cố định, tự động theo dõi IP thật của task đứng sau nó.
#
#  ALB chỉ chạy HTTP (không cần chứng chỉ SSL riêng) vì phần HTTPS đã được
#  CloudFront xử lý ở tầng trình duyệt (viewer) — CloudFront -> ALB vẫn có
#  thể là HTTP nội bộ, đây là pattern chuẩn khi không có domain riêng để
#  xin chứng chỉ ACM.
# ================================================================

resource "aws_lb" "api" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = { Name = "${var.project_name}-alb" }
}

# Target Group — type "ip" vì ECS Fargate dùng awsvpc network mode
resource "aws_lb_target_group" "api" {
  name        = "${var.project_name}-api-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/actuator/health"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 10
    interval            = 30
    matcher             = "200"
  }

  tags = { Name = "${var.project_name}-api-tg" }
}

resource "aws_lb_listener" "api_http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}
