variable "user_pool_name" {
  description = "Name of the Cognito User Pool"
  type        = string
}

variable "app_name" {
  description = "Application name (used in email templates)"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "mfa_configuration" {
  description = "MFA configuration (OFF, OPTIONAL, ON)"
  type        = string
  default     = "OPTIONAL"
  validation {
    condition     = contains(["OFF", "OPTIONAL", "ON"], var.mfa_configuration)
    error_message = "MFA configuration must be OFF, OPTIONAL, or ON"
  }
}

variable "callback_urls" {
  description = "List of allowed callback URLs for OAuth"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "logout_urls" {
  description = "List of allowed logout URLs"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "create_domain" {
  description = "Create a Cognito domain for hosted UI"
  type        = bool
  default     = false
}

variable "domain_prefix" {
  description = "Domain prefix for Cognito hosted UI"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
