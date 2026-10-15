# ==============================================================================
# AWS IAM - Mandatory Service 1: Access Management
# Implements Least-Privilege Execution Roles and Scoped Policies
# ==============================================================================

# 1. IAM Role for API Lambda Function
resource "aws_iam_role" "api_lambda_role" {
  name = "${var.project_name}-api-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Attach AWS managed basic execution policy (CloudWatch logs)
resource "aws_iam_role_policy_attachment" "api_lambda_basic_execution" {
  role       = aws_iam_role.api_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach VPC Access Execution (for connecting to RDS in private/public VPC)
resource "aws_iam_role_policy_attachment" "api_lambda_vpc_execution" {
  role       = aws_iam_role.api_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# 2. IAM Role for Scheduled Health Checker Lambda Function
resource "aws_iam_role" "checker_lambda_role" {
  name = "${var.project_name}-checker-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "checker_lambda_basic_execution" {
  role       = aws_iam_role.checker_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "checker_lambda_vpc_execution" {
  role       = aws_iam_role.checker_lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Scoped Least Privilege Policy: CloudWatch Metrics + SNS Alerting + S3 Uploads
resource "aws_iam_policy" "checker_least_privilege_policy" {
  name        = "${var.project_name}-checker-policy-${var.environment}"
  description = "Scoped permissions to emit CloudWatch metrics, dispatch SNS alerts, and save S3 reports"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchMetricsPut"
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Sid    = "SNSTopicPublishAlerts"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.uptime_alerts.arn
      },
      {
        Sid    = "S3ReportStorage"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.reports_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "checker_least_privilege_attach" {
  role       = aws_iam_role.checker_lambda_role.name
  policy_arn = aws_iam_policy.checker_least_privilege_policy.arn
}
