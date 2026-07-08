# ================================================================
#  Jenkins Server — EC2 t2.small + Docker + AWS CLI
#  Free Tier eligible (12 tháng đầu)
# ================================================================

# AMI Amazon Linux 2023 — GHIM CỨNG (không dùng most_recent) để tránh Terraform
# tự động muốn destroy + tạo lại EC2 mỗi khi AWS phát hành AMI mới.
# Muốn cập nhật AMI mới (vá bảo mật...): tự đổi giá trị default bên dưới rồi apply.
variable "jenkins_ami_id" {
  description = "AMI ID cố định cho Jenkins EC2 (Amazon Linux 2023, ap-northeast-1)"
  default     = "ami-08a10d548a59b4f15"
}


# ── Security Group cho Jenkins ───────────────────────────────────
resource "aws_security_group" "jenkins" {
  name        = "${var.project_name}-jenkins-sg"
  description = "Security group for Jenkins server"
  vpc_id      = aws_vpc.main.id

  # Jenkins UI
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Jenkins Web UI"
  }

  # SSH — chỉ cho phép từ IP của bạn, không mở ra cả Internet
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${var.my_ip}/32"]
    description = "SSH access (admin IP only)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-jenkins-sg" }
}

# ── IAM Role cho Jenkins EC2 (để push ECR, deploy ECS...) ────────
resource "aws_iam_role" "jenkins" {
  name = "${var.project_name}-jenkins-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

# Policy tối thiểu cho Jenkins — CHỈ đủ quyền để build & deploy, không phải toàn quyền
resource "aws_iam_role_policy" "jenkins_deploy" {
  name = "${var.project_name}-jenkins-deploy-policy"
  role = aws_iam_role.jenkins.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # ecr:GetAuthorizationToken bắt buộc Resource = "*" (AWS quy định, không có ARN cấp repo cho action này)
        Sid      = "EcrAuth"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        # Push/pull image — chỉ giới hạn trong 2 repo của chính project này
        Sid    = "EcrPushPull"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
        ]
        Resource = [
          aws_ecr_repository.api.arn,
          aws_ecr_repository.frontend.arn,
        ]
      },
      {
        # Deploy image mới — chỉ đúng 1 service này, không đụng được service ECS khác trong account
        Sid      = "EcsDeployScoped"
        Effect   = "Allow"
        Action   = ["ecs:UpdateService", "ecs:DescribeServices"]
        Resource = [aws_ecs_service.api.id]
      },
      {
        # Các action ECS này KHÔNG hỗ trợ giới hạn theo ARN cụ thể (AWS IAM action reference) → bắt buộc "*"
        Sid    = "EcsDeployUnscoped"
        Effect = "Allow"
        Action = [
          "ecs:RegisterTaskDefinition",
          "ecs:DescribeTaskDefinition",
          "ecs:ListTasks",
          "ecs:DescribeTasks",
        ]
        Resource = "*"
      },
      {
        # Khi register task definition mới, ECS cần "mượn" role thực thi — chỉ cho mượn ĐÚNG role này,
        # và chỉ khi role được gán cho ECS (chặn Jenkins tự gán role này cho service khác để leo thang quyền)
        Sid      = "PassExecutionRoleOnly"
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = aws_iam_role.ecs_task_execution.arn
        Condition = {
          StringEquals = { "iam:PassedToService" = "ecs-tasks.amazonaws.com" }
        }
      },
      {
        Sid      = "S3FrontendListBucket"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.frontend.arn
      },
      {
        # Sync file tĩnh (aws s3 sync) — chỉ trong đúng bucket frontend
        Sid      = "S3FrontendObjects"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      },
      {
        # Xoá cache CDN sau khi deploy frontend mới — chỉ đúng distribution này
        Sid      = "CloudFrontInvalidate"
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
        Resource = aws_cloudfront_distribution.frontend.arn
      },
    ]
  })
}

resource "aws_iam_instance_profile" "jenkins" {
  name = "${var.project_name}-jenkins-profile"
  role = aws_iam_role.jenkins.name
}

# ── SSH Key Pair ─────────────────────────────────────────────────
resource "tls_private_key" "jenkins" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "jenkins" {
  key_name   = "${var.project_name}-jenkins-key"
  public_key = tls_private_key.jenkins.public_key_openssh
}

# Lưu private key ra file để SSH
resource "local_file" "jenkins_key" {
  content         = tls_private_key.jenkins.private_key_pem
  filename        = "${path.module}/jenkins-key.pem"
  file_permission = "0400"
}

# ── EC2 Instance ─────────────────────────────────────────────────
resource "aws_instance" "jenkins" {
  ami                    = var.jenkins_ami_id
  instance_type          = "t2.small"
  key_name               = aws_key_pair.jenkins.key_name
  vpc_security_group_ids = [aws_security_group.jenkins.id]
  subnet_id              = aws_subnet.public_1.id
  iam_instance_profile   = aws_iam_instance_profile.jenkins.name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  # Script tự cài Jenkins + Docker + AWS CLI + Java + Node.js
  user_data = <<-EOF
    #!/bin/bash
    set -ex

    # === Cập nhật hệ thống ===
    dnf update -y

    # === Tạo swap 2GB — t2.small chỉ có 2GB RAM, không đủ chạy Jenkins + Docker build
    #     cùng lúc (Gradle build + docker build dễ gây OOM làm treo cả máy) ===
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo "/swapfile swap swap defaults 0 0" >> /etc/fstab

    # === Cài git ===
    # Không cài "curl" (Amazon Linux 2023 đã có sẵn "curl-minimal", 2 gói này conflict nhau) — chỉ cần git
    dnf install -y git

    # === Cài Java 21 (Jenkins LTS hiện tại yêu cầu tối thiểu Java 21, không còn hỗ trợ Java 17) ===
    dnf install -y java-21-amazon-corretto-devel

    # === Cài thêm Java 17 (song song với Java 21) — backend Spring Boot khai báo
    #     cứng languageVersion 17 trong build.gradle, Gradle cần JDK 17 riêng để compile,
    #     dù bản thân Gradle/Jenkins vẫn chạy bằng Java 21 ===
    dnf install -y java-17-amazon-corretto-devel

    # === Cài Jenkins LTS (dùng curl thay wget) ===
    curl -fsSL https://pkg.jenkins.io/redhat-stable/jenkins.repo -o /etc/yum.repos.d/jenkins.repo
    rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
    dnf install -y jenkins

    # === Cài Docker ===
    dnf install -y docker
    systemctl start docker
    systemctl enable docker
    usermod -aG docker jenkins
    usermod -aG docker ec2-user

    # === Cài Node.js 20 (build frontend) ===
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs

    # === Chuyển java.io.tmpdir ra khỏi /tmp (tmpfs chỉ ~1GB, dưới ngưỡng cảnh báo
    #     "Free Temp Space" của Jenkins khiến Built-In Node bị đánh dấu offline) ===
    mkdir -p /var/lib/jenkins/tmp
    chown jenkins:jenkins /var/lib/jenkins/tmp
    mkdir -p /etc/systemd/system/jenkins.service.d
    cat > /etc/systemd/system/jenkins.service.d/override.conf <<'TMPDIR_EOF'
[Service]
Environment="JAVA_OPTS=-Djava.awt.headless=true -Djava.io.tmpdir=/var/lib/jenkins/tmp"
TMPDIR_EOF
    systemctl daemon-reload

    # === Start Jenkins ===
    systemctl start jenkins
    systemctl enable jenkins

    # === Chờ Jenkins khởi động và lưu initial password ===
    sleep 60
    echo "=== JENKINS INITIAL PASSWORD ===" > /var/log/jenkins-setup.log
    cat /var/lib/jenkins/secrets/initialAdminPassword >> /var/log/jenkins-setup.log 2>/dev/null || echo "Password not ready yet" >> /var/log/jenkins-setup.log
  EOF

  tags = {
    Name    = "${var.project_name}-jenkins"
    Project = var.project_name
  }
}

# ── Elastic IP (IP cố định cho Jenkins) ──────────────────────────
resource "aws_eip" "jenkins" {
  instance = aws_instance.jenkins.id
  domain   = "vpc"
  tags     = { Name = "${var.project_name}-jenkins-eip" }
}
