# ==============================================================================
# Amazon CloudWatch - Monitoring & Amazon SNS - Alerting
# Implements self-monitoring: alerts if health-check stalls or sites go down
# ==============================================================================

# 1. Amazon SNS Topic for Downtime Alerts
resource "aws_sns_topic" "uptime_alerts" {
  name         = "${var.project_name}-alerts-${var.environment}"
  display_name = "Website Uptime Alerts"

  tags = {
    Name = "${var.project_name}-sns-topic"
  }
}

# SNS Email Subscription
resource "aws_sns_topic_subscription" "email_sub" {
  topic_arn = aws_sns_topic.uptime_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# 2. Amazon CloudWatch Metric Alarms

# Alarm 1: Health-Check Lambda Function Errors (Self-Monitoring Requirement)
resource "aws_cloudwatch_metric_alarm" "lambda_health_check_errors" {
  alarm_name          = "${var.project_name}-checker-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Triggers if the Health-Check Lambda function throws unhandled exceptions or stalls"
  alarm_actions       = [aws_sns_topic.uptime_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.health_checker.function_name
  }
}

# Alarm 2: Lambda Duration Alarm (Detects Checker Stalls / Timeouts)
resource "aws_cloudwatch_metric_alarm" "lambda_duration_alarm" {
  alarm_name          = "${var.project_name}-checker-duration-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Average"
  threshold           = 25000 # 25 seconds (approaching 30s timeout)
  alarm_description   = "Health check function taking longer than 25 seconds"
  alarm_actions       = [aws_sns_topic.uptime_alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.health_checker.function_name
  }
}

# Alarm 3: RDS High CPU Utilization (Free Tier Protection)
resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "${var.project_name}-rds-high-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS PostgreSQL CPU exceeded 80%"
  alarm_actions       = [aws_sns_topic.uptime_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.identifier
  }
}
