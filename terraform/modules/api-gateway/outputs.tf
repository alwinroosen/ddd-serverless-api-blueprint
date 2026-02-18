output "api_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.main.id
}

output "api_endpoint" {
  description = "Endpoint URL of the API Gateway"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "api_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_apigatewayv2_api.main.execution_arn
}

output "authorizer_id" {
  description = "ID of the Cognito authorizer"
  value       = aws_apigatewayv2_authorizer.cognito.id
}

output "custom_domain_url" {
  description = "Custom domain URL (if configured)"
  value       = var.custom_domain_name != null ? "https://${var.custom_domain_name}" : null
}
