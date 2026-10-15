# ==============================================================================
# CSE2025 AWS Solution Architect - Website Uptime Tracker
# Student: Nilam Sikdar (Roll No: 24BCC7025) - VIT-AP University
# Faculty: Dr Renita R
# Terraform Provider & Global Configuration
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "WebsiteUptimeTracker"
      Course      = "CSE2025-AWS-Solution-Architect"
      StudentName = "Nilam Sikdar"
      RollNo      = "24BCC7025"
      University  = "VIT-AP University"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}
