# Terraform Infrastructure

Infrastructure as Code for deploying the Shopping Cart API to AWS.

## Quick Start

See the [main README](../README.md#deployment-to-aws) for complete deployment instructions.

## Structure

```
terraform/
├── modules/              # Reusable Terraform modules
│   ├── api-gateway/      # HTTP API Gateway with JWT auth
│   ├── cognito/          # User Pool for authentication
│   ├── dynamodb/         # DynamoDB table
│   └── lambda/           # Lambda functions with IAM
├── environments/         # Environment-specific configs
│   ├── dev/
│   ├── staging/
│   └── prod/
└── generated/            # Auto-generated from API contracts
    ├── openapi.json
    └── endpoints-config.json
```

## Deployment

```bash
# Generate configuration
npm run generate:all

# Deploy to dev
cd environments/dev
terraform init
terraform plan
terraform apply
```

## Resources Created

- DynamoDB table with on-demand billing
- Cognito User Pool for JWT authentication
- 3 Lambda functions (Node.js 24.x)
- HTTP API Gateway with JWT authorizer
- CloudWatch logs and monitoring

For detailed information, see the [main README](../README.md).
