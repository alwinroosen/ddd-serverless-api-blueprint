/**
 * Cognito User Pool Module
 *
 * Creates a Cognito User Pool for JWT authentication.
 *
 * Following IT Handbook standards:
 * - Strong password policy
 * - MFA optional (can be enforced per-user)
 * - Email verification required
 * - Account recovery via email
 * - Custom JWT claims
 */

resource "aws_cognito_user_pool" "main" {
  name = var.user_pool_name

  # Username and email configuration
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy (IT Handbook standards)
  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  # MFA configuration (optional, can be enforced per-user)
  mfa_configuration = var.mfa_configuration

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # User verification messages
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Verify your email for ${var.app_name}"
    email_message        = "Your verification code is {####}"
  }

  # Schema attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # User pool tags
  tags = merge(
    var.tags,
    {
      Name        = var.user_pool_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# User Pool Client (for API authentication)
resource "aws_cognito_user_pool_client" "api_client" {
  name         = "${var.user_pool_name}-api-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Token configuration
  generate_secret                      = false # Public client (mobile/web apps)
  refresh_token_validity               = 30    # 30 days
  access_token_validity                = 1     # 1 hour
  id_token_validity                    = 1     # 1 hour
  token_validity_units {
    refresh_token = "days"
    access_token  = "hours"
    id_token      = "hours"
  }

  # OAuth flows
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls

  # Supported identity providers
  supported_identity_providers = ["COGNITO"]

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # Read/write attributes
  read_attributes  = ["email", "email_verified"]
  write_attributes = ["email"]
}

# User Pool Domain (for hosted UI)
resource "aws_cognito_user_pool_domain" "main" {
  count = var.create_domain ? 1 : 0

  domain       = var.domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}
