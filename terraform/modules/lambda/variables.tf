variable "function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "handler" {
  description = "Lambda function handler"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 512
}

variable "deployment_package_path" {
  description = "Path to the Lambda deployment package (zip file)"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "iam_policy_statements" {
  description = "IAM policy statements for the Lambda function"
  type = list(object({
    effect    = string
    actions   = list(string)
    resources = list(string)
  }))
}

variable "api_gateway_execution_arn" {
  description = "Execution ARN of the API Gateway"
  type        = string
}

variable "dead_letter_queue_arn" {
  description = "ARN of the dead letter queue (SQS or SNS)"
  type        = string
  default     = null
}

variable "vpc_config" {
  description = "VPC configuration for the Lambda function"
  type = object({
    subnet_ids         = list(string)
    security_group_ids = list(string)
  })
  default = null
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrent executions (-1 for unreserved)"
  type        = number
  default     = -1
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 7
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

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
