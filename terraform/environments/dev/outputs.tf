output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api_gateway.api_endpoint
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.cognito.user_pool_client_id
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = module.dynamodb.table_name
}

output "lambda_functions" {
  description = "Lambda function names"
  value = {
    create_cart = module.lambda_create_cart.function_name
    get_cart    = module.lambda_get_cart.function_name
    add_item    = module.lambda_add_item.function_name
  }
}
