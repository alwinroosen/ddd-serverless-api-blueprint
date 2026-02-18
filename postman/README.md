# Postman Collection

Quick Start collection for testing the API locally.

## Usage

1. Start the API: `npm start`
2. Import `Serverless-API-Local.postman_collection.json` into Postman
3. Run requests in order:
   - Health Check
   - Create Cart
   - Add Item (PROD-001)
   - Add Item (PROD-002)
   - Get Cart

## Test Products

| Product ID | Name             | Price  |
|------------|------------------|--------|
| PROD-001   | Premium Widget   | €29.99 |
| PROD-002   | Standard Gadget  | €15.50 |
| PROD-003   | Budget Tool      | €9.99  |

**Note:** No Authorization header needed for local development.

For more details, see the [main README](../README.md#local-development).
