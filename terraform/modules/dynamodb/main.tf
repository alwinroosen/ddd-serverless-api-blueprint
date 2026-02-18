/**
 * DynamoDB Table Module
 *
 * Creates a DynamoDB table for the shopping cart application.
 *
 * Following IT Handbook standards:
 * - Single-table design for scalability
 * - Point-in-time recovery enabled
 * - On-demand billing for cost optimization
 * - GSI for querying by userId
 * - Encryption at rest enabled
 */

resource "aws_dynamodb_table" "carts_table" {
  name           = var.table_name
  billing_mode   = "PAY_PER_REQUEST" # On-demand pricing
  hash_key       = "PK"
  range_key      = "SK"

  # Primary key attributes
  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # GSI attributes for querying by userId
  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # Global Secondary Index for user queries
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # Enable point-in-time recovery for disaster recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  # Time-to-live for automatic cart expiration (optional)
  ttl {
    enabled        = var.enable_ttl
    attribute_name = "ttl"
  }

  tags = merge(
    var.tags,
    {
      Name        = var.table_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# CloudWatch alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "read_throttle_alarm" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.table_name}-read-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "DynamoDB read throttle events"
  alarm_actions       = var.alarm_sns_topic_arn != null ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    TableName = aws_dynamodb_table.carts_table.name
  }
}

resource "aws_cloudwatch_metric_alarm" "write_throttle_alarm" {
  count = var.enable_alarms ? 1 : 0

  alarm_name          = "${var.table_name}-write-throttle"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "DynamoDB write throttle events"
  alarm_actions       = var.alarm_sns_topic_arn != null ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    TableName = aws_dynamodb_table.carts_table.name
  }
}
