# ==============================================================================
# AWS Lambda - Mandatory Service 2: Compute Service
# Serverless API Handler + EventBridge Scheduled Health Checker
# ==============================================================================

# Package the Lambda source code into a deployment zip
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda_payload.zip"
}

# 1. Backend REST API Lambda Handler
resource "aws_lambda_function" "api_handler" {
  function_name    = "${var.project_name}-api-${var.environment}"
  description      = "Backend REST API for Website Uptime Tracker (CRUD sites & history)"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.api_lambda_role.arn
  handler          = "api_handler.handler"
  runtime          = "nodejs20.x"
  timeout          = 15
  memory_size      = 256 # Free Tier includes 1M requests & 3.2M seconds

  environment {
    variables = {
      DB_HOST           = aws_db_instance.postgres.address
      DB_PORT           = "5432"
      DB_NAME           = var.db_name
      DB_USER           = var.db_username
      DB_PASSWORD       = var.db_password
      AWS_SNS_TOPIC_ARN = aws_sns_topic.uptime_alerts.arn
      ENVIRONMENT       = var.environment
    }
  }

  tags = {
    Name = "${var.project_name}-api-function"
  }
}

# CloudWatch Log Group for API Lambda
resource "aws_cloudwatch_log_group" "api_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.api_handler.function_name}"
  retention_in_days = 7
}

# 2. Scheduled Health Checker Lambda Function
resource "aws_lambda_function" "health_checker" {
  function_name    = "${var.project_name}-checker-${var.environment}"
  description      = "Scheduled ping worker for registered websites emitting CloudWatch metrics & SNS alerts"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.checker_lambda_role.arn
  handler          = "health_checker.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      DB_HOST             = aws_db_instance.postgres.address
      DB_PORT             = "5432"
      DB_NAME             = var.db_name
      DB_USER             = var.db_username
      DB_PASSWORD         = var.db_password
      AWS_SNS_TOPIC_ARN   = aws_sns_topic.uptime_alerts.arn
      REPORTS_BUCKET_NAME = aws_s3_bucket.reports_bucket.bucket
      ENVIRONMENT         = var.environment
    }
  }

  tags = {
    Name = "${var.project_name}-checker-function"
  }
}

resource "aws_cloudwatch_log_group" "checker_lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.health_checker.function_name}"
  retention_in_days = 7
}

# 3. Report Exporter Lambda Function
resource "aws_lambda_function" "report_exporter" {
  function_name    = "${var.project_name}-exporter-${var.environment}"
  description      = "Exports historical uptime audit logs to Amazon S3"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  role             = aws_iam_role.checker_lambda_role.arn
  handler          = "export_reports.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      DB_HOST             = aws_db_instance.postgres.address
      DB_PORT             = "5432"
      DB_NAME             = var.db_name
      DB_USER             = var.db_username
      DB_PASSWORD         = var.db_password
      REPORTS_BUCKET_NAME = aws_s3_bucket.reports_bucket.bucket
    }
  }
}
