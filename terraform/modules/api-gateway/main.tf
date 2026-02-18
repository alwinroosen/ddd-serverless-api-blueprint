/**
 * API Gateway Module
 *
 * Creates an HTTP API Gateway with Cognito authorizer.
 *
 * Following IT Handbook standards:
 * - CORS configuration
 * - JWT authorizer (Cognito)
 * - Throttling and rate limiting
 * - Access logging
 * - Custom domain (optional)
 */

# HTTP API Gateway
resource "aws_apigatewayv2_api" "main" {
  name          = var.api_name
  protocol_type = "HTTP"
  description   = var.api_description

  # CORS configuration
  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = var.cors_allow_methods
    allow_headers = var.cors_allow_headers
    expose_headers = [
      "X-Request-ID",
      "X-Amz-Date"
    ]
    max_age              = 86400 # 24 hours
    allow_credentials    = true
  }

  tags = merge(
    var.tags,
    {
      Name        = var.api_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# JWT Authorizer (Cognito)
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.api_name}-cognito-authorizer"

  jwt_configuration {
    audience = [var.cognito_user_pool_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# Default stage (auto-deploy)
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  # Access logging
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }

  # Throttling
  default_route_settings {
    throttling_burst_limit = var.throttling_burst_limit
    throttling_rate_limit  = var.throttling_rate_limit
  }

  tags = merge(
    var.tags,
    {
      Name        = "${var.api_name}-default-stage"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# CloudWatch Logs group for API access logs
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${var.api_name}"
  retention_in_days = var.log_retention_days

  tags = merge(
    var.tags,
    {
      Name        = "${var.api_name}-logs"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# Custom domain (optional)
resource "aws_apigatewayv2_domain_name" "custom" {
  count = var.custom_domain_name != null ? 1 : 0

  domain_name = var.custom_domain_name

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = merge(
    var.tags,
    {
      Name        = var.custom_domain_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# API mapping for custom domain
resource "aws_apigatewayv2_api_mapping" "custom" {
  count = var.custom_domain_name != null ? 1 : 0

  api_id      = aws_apigatewayv2_api.main.id
  domain_name = aws_apigatewayv2_domain_name.custom[0].id
  stage       = aws_apigatewayv2_stage.default.id
}

# Route 53 record for custom domain (if zone provided)
resource "aws_route53_record" "api" {
  count = var.custom_domain_name != null && var.route53_zone_id != null ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.custom_domain_name
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.custom[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.custom[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}
