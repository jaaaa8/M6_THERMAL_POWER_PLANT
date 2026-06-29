# ================================================================
#  Thermal Power Plant — AWS Infrastructure (Terraform)
#  Region: ap-northeast-1 (Tokyo)
#  Account: 197826770971
# ================================================================

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider chính — Tokyo
provider "aws" {
  region = var.aws_region
}
