variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project identifier prefix"
  type        = string
  default     = "uptime-tracker"
}

variable "db_name" {
  description = "Amazon RDS PostgreSQL database name"
  type        = string
  default     = "uptime_db"
}

variable "db_username" {
  description = "Amazon RDS master username"
  type        = string
  default     = "postgresadmin"
}

variable "db_password" {
  description = "Amazon RDS master password (min 8 chars)"
  type        = string
  default     = "UptimeTracker2026Secure!"
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class eligible for AWS Free Tier"
  type        = string
  default     = "db.t4g.micro"
}

variable "alert_email" {
  description = "Email address for Amazon SNS downtime alert notifications"
  type        = string
  default     = "nilam.sikdar@example.com"
}
