#!/bin/bash

# Setup local DynamoDB tables for testing
set -e

echo "🚀 Setting up local DynamoDB tables..."

# Configuration
ENDPOINT="http://localhost:8000"
REGION="us-east-1"
TABLE_NAME="serverless-api-local"

# Export dummy AWS credentials (required by AWS CLI, not validated by DynamoDB Local)
export AWS_ACCESS_KEY_ID="local"
export AWS_SECRET_ACCESS_KEY="local"

# Disable AWS CLI pager (prevents interactive prompts)
export AWS_PAGER=""

# Wait for DynamoDB to be ready
echo "⏳ Waiting for DynamoDB Local to be ready..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  # First check if port is accessible with curl
  if curl -s http://localhost:8000 >/dev/null 2>&1; then
    # Then verify with AWS CLI
    if aws dynamodb list-tables --endpoint-url "$ENDPOINT" --region "$REGION" >/dev/null 2>&1; then
      echo "✅ DynamoDB Local is ready"
      break
    fi
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ DynamoDB Local failed to start after 30 seconds"
    echo "   Check Docker logs: docker-compose logs dynamodb-local"
    echo ""
    echo "   Debugging info:"
    echo "   - Testing port accessibility:"
    curl -v http://localhost:8000 2>&1 | head -5 || echo "     Port not accessible"
    echo ""
    echo "   - Testing AWS CLI connection:"
    aws dynamodb list-tables --endpoint-url "$ENDPOINT" --region "$REGION" 2>&1 || true
    exit 1
  fi

  echo "   Attempt $RETRY_COUNT/$MAX_RETRIES - waiting..."
  sleep 1
done

# Delete table if it exists
echo "🗑️  Deleting existing table (if any)..."
aws dynamodb delete-table \
  --table-name "$TABLE_NAME" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  2>/dev/null || echo "Table doesn't exist yet"

# Wait a moment for deletion
sleep 2

# Create Carts table (single-table design)
echo "📦 Creating Carts table..."
aws dynamodb create-table \
  --table-name "$TABLE_NAME" \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --provisioned-throughput \
    ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  > /dev/null 2>&1

echo "⏳ Waiting for table to be active..."
aws dynamodb wait table-exists \
  --table-name "$TABLE_NAME" \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION"

# Seed test products
echo "🌱 Seeding test data (products)..."

echo "   - PROD-001: Premium Widget (€29.99)"
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "PK": {"S": "PRODUCT#PROD-001"},
    "SK": {"S": "METADATA"},
    "productId": {"S": "PROD-001"},
    "name": {"S": "Premium Widget"},
    "description": {"S": "A high-quality widget for all your needs"},
    "price": {
      "M": {
        "amount": {"N": "29.99"},
        "currency": {"S": "EUR"}
      }
    },
    "isActive": {"BOOL": true},
    "createdAt": {"S": "2024-01-01T00:00:00.000Z"},
    "updatedAt": {"S": "2024-01-01T00:00:00.000Z"},
    "GSI1PK": {"S": "PRODUCT_CATALOG"},
    "GSI1SK": {"S": "PRODUCT#PROD-001"},
    "entityType": {"S": "PRODUCT"}
  }' \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  > /dev/null 2>&1

echo "   - PROD-002: Standard Gadget (€15.50)"
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "PK": {"S": "PRODUCT#PROD-002"},
    "SK": {"S": "METADATA"},
    "productId": {"S": "PROD-002"},
    "name": {"S": "Standard Gadget"},
    "description": {"S": "Reliable gadget for everyday use"},
    "price": {
      "M": {
        "amount": {"N": "15.50"},
        "currency": {"S": "EUR"}
      }
    },
    "isActive": {"BOOL": true},
    "createdAt": {"S": "2024-01-01T00:00:00.000Z"},
    "updatedAt": {"S": "2024-01-01T00:00:00.000Z"},
    "GSI1PK": {"S": "PRODUCT_CATALOG"},
    "GSI1SK": {"S": "PRODUCT#PROD-002"},
    "entityType": {"S": "PRODUCT"}
  }' \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  > /dev/null 2>&1

echo "   - PROD-003: Budget Tool (€9.99)"
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "PK": {"S": "PRODUCT#PROD-003"},
    "SK": {"S": "METADATA"},
    "productId": {"S": "PROD-003"},
    "name": {"S": "Budget Tool"},
    "description": {"S": "Affordable tool for basic tasks"},
    "price": {
      "M": {
        "amount": {"N": "9.99"},
        "currency": {"S": "EUR"}
      }
    },
    "isActive": {"BOOL": true},
    "createdAt": {"S": "2024-01-01T00:00:00.000Z"},
    "updatedAt": {"S": "2024-01-01T00:00:00.000Z"},
    "GSI1PK": {"S": "PRODUCT_CATALOG"},
    "GSI1SK": {"S": "PRODUCT#PROD-003"},
    "entityType": {"S": "PRODUCT"}
  }' \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  > /dev/null 2>&1

echo "✅ Local DynamoDB setup complete!"
echo ""
echo "📊 Table: $TABLE_NAME"
echo "🌐 DynamoDB Local: http://localhost:8000"
echo "🎨 Admin UI: http://localhost:8001"
echo ""
echo "To list tables:"
echo "  aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1"
echo ""
echo "To scan products:"
echo "  aws dynamodb scan --table-name $TABLE_NAME --endpoint-url http://localhost:8000 --region us-east-1"
