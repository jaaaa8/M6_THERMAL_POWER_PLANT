# ================================================================
#  Jenkins Server — EC2 t2.small + Docker + AWS CLI
#  Free Tier eligible (12 tháng đầu)
# ================================================================

# Lấy AMI Amazon Linux 2023 mới nhất
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
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

resource "aws_iam_role_policy_attachment" "jenkins_admin" {
  role       = aws_iam_role.jenkins.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
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
  ami                    = data.aws_ami.amazon_linux.id
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

    # === Cài curl, git ===
    dnf install -y curl git

    # === Cài Java 17 (Jenkins cần) ===
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
