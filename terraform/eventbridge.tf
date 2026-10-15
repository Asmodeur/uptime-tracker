# ==============================================================================
# Amazon EventBridge - Cloud Scheduling
# Triggers the Health Checker Lambda function automatically on fixed interval
# Replaces original 30-second client-side polling loop with cloud-native cron
# ==============================================================================

resource "aws_cloudwatch_event_rule" "uptime_schedule" {
  name                = "${var.project_name}-schedule-rule-${var.environment}"
  description         = "Periodic trigger for AWS Lambda health-check pings"
  schedule_expression = "rate(1 minute)" # Checks websites automatically every minute
  state               = "ENABLED"

  tags = {
    Name = "${var.project_name}-eventbridge-rule"
  }
}

resource "aws_cloudwatch_event_target" "health_checker_target" {
  rule      = aws_cloudwatch_event_rule.uptime_schedule.name
  target_id = "HealthCheckerLambdaTarget"
  arn       = aws_lambda_function.health_checker.arn
}

resource "aws_lambda_permission" "eventbridge_invoke_checker" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_checker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.uptime_schedule.arn
}
