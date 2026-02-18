variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
}

variable "api_description" {
  description = "Description of the API Gateway"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "cors_allow_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_methods" {
  description = "Allowed methods for CORS"
  type        = list(string)
  default     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}

variable "cors_allow_headers" {
  description = "Allowed headers for CORS"
  type        = list(string)
  default = [
    "Content-Type",
    "Authorization",
    "X-Amz-Date",
    "X-Api-Key",
    "X-Amz-Security-Token"
  ]
}

variable "throttling_burst_limit" {
  description = "Throttling burst limit (requests)"
  type        = number
  default     = 500
}

variable "throttling_rate_limit" {
  description = "Throttling rate limit (requests per second)"
  type        = number
  default     = 100
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 7
}

variable "custom_domain_name" {
  description = "Custom domain name for the API"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for custom domain"
  type        = string
  default     = null
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID for DNS record"
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
