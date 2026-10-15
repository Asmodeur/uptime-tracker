# ==============================================================================
# Amazon RDS (PostgreSQL) - Mandatory Service 4: Database Service
# Fully Managed Relational Database replacing Supabase
# Configured for AWS Free Tier eligibility (db.t4g.micro / 20GB gp3)
# ==============================================================================

# Default VPC and Subnets (utilizing standard Free Tier networking)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "uptime_db_subnet_group" {
  name        = "${var.project_name}-db-subnets-${var.environment}"
  subnet_ids  = data.aws_subnets.default.ids
  description = "Subnet group for Website Uptime Tracker PostgreSQL RDS"

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# Security Group for Amazon RDS PostgreSQL
resource "aws_security_group" "rds_sg" {
  name        = "${var.project_name}-rds-sg-${var.environment}"
  description = "Controls inbound traffic to PostgreSQL RDS from Lambda functions"
  vpc_id      = data.aws_vpc.default.id

  # Ingress: Allow PostgreSQL 5432 from within VPC / Lambda security group
  ingress {
    description = "PostgreSQL access from application security group"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-security-group"
  }
}

# Amazon RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-db-${var.environment}"
  engine            = "postgres"
  engine_version    = "16.1"
  instance_class    = var.db_instance_class
  allocated_storage = 20 # 20 GB Storage (Free Tier limit: up to 20 GB)
  storage_type      = "gp3"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.uptime_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  skip_final_snapshot     = true
  publicly_accessible     = true # Allows direct migration script execution and demo testing
  backup_retention_period = 0    # Minimized for dev / free tier evaluation

  tags = {
    Name = "${var.project_name}-postgres-db"
  }
}
