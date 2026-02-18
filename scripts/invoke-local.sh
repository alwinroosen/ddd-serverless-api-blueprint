#!/bin/bash

# Invoke Lambda functions locally for testing
set -e

# Configuration
DYNAMODB_ENDPOINT="http://localhost:8000"
TABLE_NAME="serverless-api-local"
REGION="us-east-1"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Mock JWT token (decoded payload: {"sub": "test-user-123", "cognito:username": "testuser"})
# Note: This is a mock token that will fail real JWT verification
# For local testing, you'd need to disable JWT verification or use a test token
MOCK_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiY29nbml0bzp1c2VybmFtZSI6InRlc3R1c2VyIn0.mock"

# Export environment variables for Lambda
export DYNAMODB_TABLE_NAME="$TABLE_NAME"
export AWS_REGION="$REGION"
export COGNITO_USER_POOL_ID="us-east-1_LOCALTEST"  # Valid format for Cognito User Pool ID
export COGNITO_CLIENT_ID="test-client-local-123456"
export LOG_LEVEL="debug"
export AWS_ACCESS_KEY_ID="local"
export AWS_SECRET_ACCESS_KEY="local"
export DYNAMODB_ENDPOINT="$DYNAMODB_ENDPOINT"
export DISABLE_JWT_VERIFICATION="true"  # Bypass JWT verification for local testing

function print_usage() {
  echo "Usage: $0 <function> [options]"
  echo ""
  echo "Functions:"
  echo "  create-cart              Create a new cart"
  echo "  get-cart <cart-id>      Get cart by ID"
  echo "  add-item <cart-id>      Add item to cart"
  echo ""
  echo "Options:"
  echo "  --currency <EUR|USD>    Currency for cart (default: EUR)"
  echo "  --product <id>          Product ID to add"
  echo "  --quantity <n>          Quantity to add (default: 1)"
  echo ""
  echo "Examples:"
  echo "  $0 create-cart"
  echo "  $0 get-cart 550e8400-e29b-41d4-a716-446655440000"
  echo "  $0 add-item 550e8400-e29b-41d4-a716-446655440000 --product PROD-001 --quantity 2"
}

function invoke_create_cart() {
  local currency="EUR"

  # Parse named parameters
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --currency)
        currency="$2"
        shift 2
        ;;
      *)
        shift
        ;;
    esac
  done

  echo -e "${BLUE}🚀 Invoking CreateCart Lambda...${NC}"

  node -e "
    const handler = require('./packages/lambda-create-cart/dist/index.js').handler;

    const event = {
      headers: {
        authorization: 'Bearer $MOCK_TOKEN',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ currency: '$currency' }),
      requestContext: {
        requestId: 'local-test-' + Date.now()
      }
    };

    const context = {
      getRemainingTimeInMillis: () => 30000
    };

    handler(event, context).then(response => {
      console.log('\\n${GREEN}✅ Response:${NC}');
      console.log(JSON.stringify(JSON.parse(response.body), null, 2));
    }).catch(err => {
      console.error('\\n${RED}❌ Error:${NC}', err);
      process.exit(1);
    });
  "
}

function invoke_get_cart() {
  local cart_id="$1"

  if [ -z "$cart_id" ]; then
    echo -e "${RED}❌ Error: Cart ID required${NC}"
    print_usage
    exit 1
  fi

  echo -e "${BLUE}🚀 Invoking GetCart Lambda...${NC}"

  node -e "
    const handler = require('./packages/lambda-get-cart/dist/index.js').handler;

    const event = {
      headers: {
        authorization: 'Bearer $MOCK_TOKEN'
      },
      pathParameters: {
        cartId: '$cart_id'
      },
      requestContext: {
        requestId: 'local-test-' + Date.now()
      }
    };

    const context = {
      getRemainingTimeInMillis: () => 30000
    };

    handler(event, context).then(response => {
      console.log('\\n${GREEN}✅ Response:${NC}');
      console.log(JSON.stringify(JSON.parse(response.body), null, 2));
    }).catch(err => {
      console.error('\\n${RED}❌ Error:${NC}', err);
      process.exit(1);
    });
  "
}

function invoke_add_item() {
  local cart_id="$1"
  shift

  # Default values
  local product_id="PROD-001"
  local quantity="1"

  # Parse named parameters
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --product)
        product_id="$2"
        shift 2
        ;;
      --quantity)
        quantity="$2"
        shift 2
        ;;
      *)
        shift
        ;;
    esac
  done

  if [ -z "$cart_id" ]; then
    echo -e "${RED}❌ Error: Cart ID required${NC}"
    print_usage
    exit 1
  fi

  echo -e "${BLUE}🚀 Invoking AddItemToCart Lambda...${NC}"

  node -e "
    const handler = require('./packages/lambda-add-item/dist/index.js').handler;

    const event = {
      headers: {
        authorization: 'Bearer $MOCK_TOKEN',
        'content-type': 'application/json'
      },
      pathParameters: {
        cartId: '$cart_id'
      },
      body: JSON.stringify({
        productId: '$product_id',
        quantity: $quantity
      }),
      requestContext: {
        requestId: 'local-test-' + Date.now()
      }
    };

    const context = {
      getRemainingTimeInMillis: () => 30000
    };

    handler(event, context).then(response => {
      console.log('\\n${GREEN}✅ Response:${NC}');
      console.log(JSON.stringify(JSON.parse(response.body), null, 2));
    }).catch(err => {
      console.error('\\n${RED}❌ Error:${NC}', err);
      process.exit(1);
    });
  "
}

# Parse arguments
FUNCTION="$1"
shift || true

case "$FUNCTION" in
  create-cart)
    invoke_create_cart "$@"
    ;;
  get-cart)
    invoke_get_cart "$@"
    ;;
  add-item)
    invoke_add_item "$@"
    ;;
  *)
    echo -e "${RED}❌ Error: Unknown function '$FUNCTION'${NC}"
    echo ""
    print_usage
    exit 1
    ;;
esac
