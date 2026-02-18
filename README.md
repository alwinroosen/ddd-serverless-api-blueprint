# Serverless API Blueprint

> Production-ready serverless API demonstrating Domain-Driven Design, TypeScript best practices, and AWS serverless architecture.

## Overview

A complete serverless shopping cart API showcasing:

- **Domain-Driven Design** - Clean separation of concerns across domain, application, and infrastructure layers
- **TypeScript 5.x** - Strict type safety with modern features
- **AWS Serverless Stack** - Lambda, API Gateway, DynamoDB, Cognito
- **Contract-First API** - Zod schemas with auto-generated OpenAPI and Terraform
- **Comprehensive Testing** - Unit and integration tests with 80%+ coverage
- **Infrastructure as Code** - Complete Terraform configuration

### API Endpoints

| Method | Path                     | Description       |
| ------ | ------------------------ | ----------------- |
| POST   | `/api/v1/cart`           | Create a new cart |
| GET    | `/api/v1/cart/:id`       | Get cart by ID    |
| POST   | `/api/v1/cart/:id/items` | Add item to cart  |

## Architecture

### High-Level Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTPS + JWT
       ▼
┌────────────────────────┐
│  API Gateway (HTTP)    │
│  - JWT Authorizer      │
│  - Rate limiting       │
└─────────┬──────────────┘
          │
          ├──► Lambda: Create Cart ──┐
          ├──► Lambda: Get Cart ─────┤
          └──► Lambda: Add Item ─────┤
                                      │
                                      ▼
                           ┌──────────────────┐
                           │    DynamoDB      │
                           └──────────────────┘
```

### Project Structure

```
├── libs/                        # Shared libraries
│   ├── domain/                  # Business logic (pure)
│   │   ├── entities/            # Cart, CartItem
│   │   ├── value-objects/       # CartId, Money, ProductId
│   │   └── repositories/        # Repository interfaces
│   ├── application/             # Use cases (orchestration)
│   ├── infrastructure/          # External adapters
│   │   ├── persistence/         # DynamoDB repository
│   │   └── auth/                # Cognito JWT verification
│   └── api-contracts/           # Zod schemas + OpenAPI
├── packages/                    # Lambda functions
│   ├── lambda-create-cart/
│   ├── lambda-get-cart/
│   └── lambda-add-item/
└── terraform/                   # Infrastructure as Code
    ├── modules/                 # Reusable modules
    └── environments/            # Environment configs
```

## Prerequisites

- **Node.js** >= 24.0.0
- **npm** >= 10.0.0
- **Docker** (for local development)
- **Terraform** >= 1.5.0 (for deployment)
- **AWS CLI** >= 2.0 (for deployment)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Build All Packages

```bash
npm run build
```

### 3. Run Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage
```

## Local Development

### Start the Development Server

```bash
# Start everything (DynamoDB + API server)
npm start
```

The API will be available at:
- **API Server**: http://localhost:3000
- **DynamoDB Admin UI**: http://localhost:8001

### Test the API

#### With curl

```bash
# Health check
curl http://localhost:3000/health

# Create cart
curl -X POST http://localhost:3000/api/v1/cart \
  -H "Content-Type: application/json" \
  -d '{"currency": "EUR"}'

# Get cart (replace {cartId} with actual ID)
curl http://localhost:3000/api/v1/cart/{cartId}

# Add item to cart
curl -X POST http://localhost:3000/api/v1/cart/{cartId}/items \
  -H "Content-Type: application/json" \
  -d '{"productId": "PROD-001", "quantity": 2}'
```

#### With Postman

Import the collection from `postman/Serverless-API-Local.postman_collection.json`

#### Test Products

| Product ID | Name             | Price  |
|------------|------------------|--------|
| PROD-001   | Premium Widget   | €29.99 |
| PROD-002   | Standard Gadget  | €15.50 |
| PROD-003   | Budget Tool      | €9.99  |

**Note:** JWT verification is automatically disabled for local development.

### Running Integration Tests

```bash
# Terminal 1: Start the API server
npm start

# Terminal 2: Run integration tests
npm run test:integration
```

### Stop the Server

```bash
npm stop
```

## Deployment to AWS

### Step 1: Configure AWS

```bash
# Configure AWS CLI
aws configure
```

### Step 2: Generate API Contracts

```bash
# Generate OpenAPI spec and Terraform config from Zod schemas
npm run generate:all
```

This creates:
- `terraform/generated/openapi.json` - OpenAPI 3.0 specification
- `terraform/generated/endpoints-config.json` - Lambda and IAM configuration

### Step 3: Build and Package Lambda Functions

```bash
# Build TypeScript
npm run build

# Package each Lambda function
npm run package:all-lambdas
```

This creates deployment packages in `packages/lambda-*/dist.zip`

### Step 4: Deploy Infrastructure

```bash
cd terraform/environments/dev

# Initialize Terraform
terraform init

# Review changes
terraform plan

# Deploy
terraform apply
```

### Step 5: Get Deployment Outputs

```bash
terraform output
```

Save these values:
- `api_endpoint` - Your API URL
- `cognito_user_pool_id` - For creating users
- `cognito_client_id` - For authentication

### Step 6: Test Production Deployment

#### Create a test user

```bash
aws cognito-idp sign-up \
  --client-id $(terraform output -raw cognito_client_id) \
  --username test@example.com \
  --password TestPassword123! \
  --user-attributes Name=email,Value=test@example.com

# Confirm user (admin)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id $(terraform output -raw cognito_user_pool_id) \
  --username test@example.com
```

#### Get JWT token

```bash
aws cognito-idp initiate-auth \
  --client-id $(terraform output -raw cognito_client_id) \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=test@example.com,PASSWORD=TestPassword123!
```

#### Test the API

```bash
API_ENDPOINT=$(terraform output -raw api_endpoint)
TOKEN="<your-access-token>"

# Create cart
curl -X POST "$API_ENDPOINT/api/v1/cart" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123","currency":"EUR"}'
```

## AWS Resources

The Terraform configuration deploys:

- **DynamoDB** - `carts-{env}` table with on-demand billing
- **Cognito** - User Pool for JWT authentication
- **Lambda Functions** (3) - Node.js 24.x runtime with least-privilege IAM
- **API Gateway** - HTTP API with JWT authorizer
- **CloudWatch** - Log groups and monitoring

**Estimated cost for dev environment:** ~$10-15/month (low traffic)

## Development Standards

### Code Quality

- ESLint with strict rules
- Prettier formatting
- TypeScript strict mode
- 80%+ test coverage
- Pre-commit hooks (Husky)

### Naming Conventions

- Files: `kebab-case.ts`
- Classes/Interfaces: `PascalCase`
- Functions/Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### Commit Messages

```bash
# With Jira ticket
[TDCMW-xxx][DCMW3-xxx] Add shopping cart domain logic

# Without Jira ticket
NOJIRA Update README documentation
```

## Testing Strategy

### Unit Tests
Fast, isolated tests for domain/application/infrastructure layers:
```bash
npm test
```

### Integration Tests
HTTP-based tests verifying complete API flows:
```bash
npm start                    # Terminal 1
npm run test:integration     # Terminal 2
```
