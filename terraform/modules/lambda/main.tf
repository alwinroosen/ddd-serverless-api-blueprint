/**
 * Lambda Function Module
 *
 * Creates a Lambda function with IAM role and policies.
 *
 * Following IT Handbook standards:
 * - Least-privilege IAM permissions
 * - CloudWatch Logs integration
 * - Environment-specific configuration
 * - Dead letter queue for failed invocations
 */

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_role" {
  name = "${var.function_name}-role"

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

  tags = merge(
    var.tags,
    {
      Name        = "${var.function_name}-role"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# IAM policy for Lambda execution (from generated config)
resource "aws_iam_policy" "lambda_policy" {
  name        = "${var.function_name}-policy"
  description = "IAM policy for ${var.function_name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = var.iam_policy_statements
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# CloudWatch Logs group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name        = "${var.function_name}-logs"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# Lambda function
resource "aws_lambda_function" "function" {
  filename         = var.deployment_package_path
  function_name    = var.function_name
  role             = aws_iam_role.lambda_role.arn
  handler          = var.handler
  source_code_hash = filebase64sha256(var.deployment_package_path)
  runtime          = var.runtime
  timeout          = var.timeout
  memory_size      = var.memory_size

  environment {
    variables = var.environment_variables
  }

  # Dead letter queue for failed invocations (optional)
  dynamic "dead_letter_config" {
    for_each = var.dead_letter_queue_arn != null ? [1] : []
    content {
      target_arn = var.dead_letter_queue_arn
    }
  }

  # VPC configuration (if needed)
  dynamic "vpc_config" {
    for_each = var.vpc_config != null ? [var.vpc_config] : []
    content {
      subnet_ids         = vpc_config.value.subnet_ids
      security_group_ids = vpc_config.value.security_group_ids
    }
  }

  # Reserved concurrent executions
  reserved_concurrent_executions = var.reserved_concurrent_executions

  tags = merge(
    var.tags,
    {
      Name        = var.function_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )

  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_iam_role_policy_attachment.lambda_policy_attachment
  ]
}

# Lambda permission for API Gateway invocation
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}

# CloudWatch alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.function_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Lambda function errors"
  alarm_actions       = var.alarm_sns_topic_arn != null ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    FunctionName = aws_lambda_function.function.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.function_name}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = var.timeout * 1000 * 0.8 # 80% of timeout
  alarm_description   = "Lambda function duration approaching timeout"
  alarm_actions       = var.alarm_sns_topic_arn != null ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    FunctionName = aws_lambda_function.function.function_name
  }
}
