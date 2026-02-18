/**
 * Development Environment - Main Terraform Configuration
 *
 * This configuration creates all AWS infrastructure for the shopping cart API.
 *
 * Following IT Handbook standards:
 * - Infrastructure as Code
 * - Environment-specific configuration
 * - Auto-generated from API contracts
 * - Least-privilege IAM policies
 */

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration (uncomment for remote state)
  # backend "s3" {
  #   bucket         = "bpost-terraform-state"
  #   key            = "shopping-cart-api/dev/terraform.tfstate"
  #   region         = "eu-west-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Shopping Cart API"
      Environment = "dev"
      ManagedBy   = "Terraform"
      Repository  = "it-handbook/blueprints/serverless-api"
    }
  }
}

# Load generated endpoint configuration
locals {
  endpoints_config = jsondecode(file("${path.module}/../../generated/endpoints-config.json"))
}

# DynamoDB Table
module "dynamodb" {
  source = "../../modules/dynamodb"

  table_name                   = "carts-dev"
  environment                  = "dev"
  enable_point_in_time_recovery = true
  enable_ttl                   = false
  enable_alarms                = true
}

# Cognito User Pool
module "cognito" {
  source = "../../modules/cognito"

  user_pool_name    = "shopping-cart-api-dev"
  app_name          = "Shopping Cart API"
  environment       = "dev"
  mfa_configuration = "OPTIONAL"
  callback_urls     = ["http://localhost:3000/callback"]
  logout_urls       = ["http://localhost:3000"]
}

# API Gateway
module "api_gateway" {
  source = "../../modules/api-gateway"

  api_name                    = "shopping-cart-api-dev"
  api_description             = "Shopping Cart API - Development"
  environment                 = "dev"
  cognito_user_pool_id        = module.cognito.user_pool_id
  cognito_user_pool_client_id = module.cognito.user_pool_client_id
  aws_region                  = var.aws_region

  # CORS configuration (permissive for dev)
  cors_allow_origins = ["*"]

  # Throttling (lower limits for dev)
  throttling_burst_limit = 100
  throttling_rate_limit  = 50
}

# Lambda Functions (from generated config)
module "lambda_create_cart" {
  source = "../../modules/lambda"

  function_name            = local.endpoints_config["lambda-create-cart"].functionName
  handler                  = local.endpoints_config["lambda-create-cart"].handler
  runtime                  = local.endpoints_config["lambda-create-cart"].runtime
  timeout                  = local.endpoints_config["lambda-create-cart"].timeout
  memory_size              = local.endpoints_config["lambda-create-cart"].memorySize
  deployment_package_path  = "${path.module}/../../../dist/lambda-create-cart.zip"
  api_gateway_execution_arn = module.api_gateway.api_execution_arn
  environment              = "dev"

  environment_variables = merge(
    local.endpoints_config["lambda-create-cart"].environment,
    {
      DYNAMODB_TABLE_NAME   = module.dynamodb.table_name
      COGNITO_USER_POOL_ID  = module.cognito.user_pool_id
      COGNITO_CLIENT_ID     = module.cognito.user_pool_client_id
      NODE_ENV              = "development"
      LOG_LEVEL             = "debug"
    }
  )

  iam_policy_statements = local.endpoints_config["lambda-create-cart"].iamPolicyStatements
}

module "lambda_get_cart" {
  source = "../../modules/lambda"

  function_name            = local.endpoints_config["lambda-get-cart"].functionName
  handler                  = local.endpoints_config["lambda-get-cart"].handler
  runtime                  = local.endpoints_config["lambda-get-cart"].runtime
  timeout                  = local.endpoints_config["lambda-get-cart"].timeout
  memory_size              = local.endpoints_config["lambda-get-cart"].memorySize
  deployment_package_path  = "${path.module}/../../../dist/lambda-get-cart.zip"
  api_gateway_execution_arn = module.api_gateway.api_execution_arn
  environment              = "dev"

  environment_variables = merge(
    local.endpoints_config["lambda-get-cart"].environment,
    {
      DYNAMODB_TABLE_NAME   = module.dynamodb.table_name
      COGNITO_USER_POOL_ID  = module.cognito.user_pool_id
      COGNITO_CLIENT_ID     = module.cognito.user_pool_client_id
      NODE_ENV              = "development"
      LOG_LEVEL             = "debug"
    }
  )

  iam_policy_statements = local.endpoints_config["lambda-get-cart"].iamPolicyStatements
}

module "lambda_add_item" {
  source = "../../modules/lambda"

  function_name            = local.endpoints_config["lambda-add-item"].functionName
  handler                  = local.endpoints_config["lambda-add-item"].handler
  runtime                  = local.endpoints_config["lambda-add-item"].runtime
  timeout                  = local.endpoints_config["lambda-add-item"].timeout
  memory_size              = local.endpoints_config["lambda-add-item"].memorySize
  deployment_package_path  = "${path.module}/../../../dist/lambda-add-item.zip"
  api_gateway_execution_arn = module.api_gateway.api_execution_arn
  environment              = "dev"

  environment_variables = merge(
    local.endpoints_config["lambda-add-item"].environment,
    {
      DYNAMODB_TABLE_NAME   = module.dynamodb.table_name
      COGNITO_USER_POOL_ID  = module.cognito.user_pool_id
      COGNITO_CLIENT_ID     = module.cognito.user_pool_client_id
      NODE_ENV              = "development"
      LOG_LEVEL             = "debug"
    }
  )

  iam_policy_statements = local.endpoints_config["lambda-add-item"].iamPolicyStatements
}

# API Gateway Routes
resource "aws_apigatewayv2_integration" "create_cart" {
  api_id                 = module.api_gateway.api_id
  integration_type       = "AWS_PROXY"
  integration_uri        = module.lambda_create_cart.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "create_cart" {
  api_id             = module.api_gateway.api_id
  route_key          = "POST /api/v1/cart"
  target             = "integrations/${aws_apigatewayv2_integration.create_cart.id}"
  authorization_type = "JWT"
  authorizer_id      = module.api_gateway.authorizer_id
}

resource "aws_apigatewayv2_integration" "get_cart" {
  api_id                 = module.api_gateway.api_id
  integration_type       = "AWS_PROXY"
  integration_uri        = module.lambda_get_cart.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_cart" {
  api_id             = module.api_gateway.api_id
  route_key          = "GET /api/v1/cart/{cartId}"
  target             = "integrations/${aws_apigatewayv2_integration.get_cart.id}"
  authorization_type = "JWT"
  authorizer_id      = module.api_gateway.authorizer_id
}

resource "aws_apigatewayv2_integration" "add_item" {
  api_id                 = module.api_gateway.api_id
  integration_type       = "AWS_PROXY"
  integration_uri        = module.lambda_add_item.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "add_item" {
  api_id             = module.api_gateway.api_id
  route_key          = "POST /api/v1/cart/{cartId}/items"
  target             = "integrations/${aws_apigatewayv2_integration.add_item.id}"
  authorization_type = "JWT"
  authorizer_id      = module.api_gateway.authorizer_id
}
