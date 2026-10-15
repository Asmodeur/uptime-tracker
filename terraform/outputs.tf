# ==============================================================================
# Terraform Outputs - Website Uptime Tracker Deployment Summary
# ==============================================================================

output "api_gateway_endpoint" {
  description = "Public API Gateway REST endpoint URL"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "cloudfront_domain_name" {
  description = "Amazon CloudFront HTTPS CDN domain for React frontend"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "s3_frontend_bucket" {
  description = "Amazon S3 bucket name hosting static React frontend build"
  value       = aws_s3_bucket.frontend_bucket.bucket
}

output "s3_reports_bucket" {
  description = "Amazon S3 bucket name storing exported uptime reports"
  value       = aws_s3_bucket.reports_bucket.bucket
}

output "rds_postgres_endpoint" {
  description = "Amazon RDS PostgreSQL connection endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "sns_topic_arn" {
  description = "Amazon SNS Topic ARN for downtime notifications"
  value       = aws_sns_topic.uptime_alerts.arn
}

output "eventbridge_schedule" {
  description = "EventBridge recurring ping schedule rule"
  value       = aws_cloudwatch_event_rule.uptime_schedule.name
}

output "viva_quick_guide" {
  description = "Instructions for testing and viva presentation"
  value       = "Frontend live via CloudFront: https://${aws_cloudfront_distribution.cdn.domain_name} | API Gateway: ${aws_apigatewayv2_api.http_api.api_endpoint}"
}
