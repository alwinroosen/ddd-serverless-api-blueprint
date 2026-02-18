variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for the table"
  type        = bool
  default     = true
}

variable "enable_ttl" {
  description = "Enable time-to-live for automatic item expiration"
  type        = bool
  default     = false
}

variable "kms_key_arn" {
  description = "ARN of KMS key for encryption (null uses AWS managed key)"
  type        = string
  default     = null
}

variable "enable_alarms" {
  description = "Enable CloudWatch alarms for monitoring"
  type        = bool
  default     = true
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional tags for the table"
  type        = map(string)
  default     = {}
}
