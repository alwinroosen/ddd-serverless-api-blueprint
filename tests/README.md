# Integration Tests

HTTP-based integration tests for the Shopping Cart API.

## Quick Start

```bash
# Terminal 1: Start the API server
npm start

# Terminal 2: Run integration tests
npm run test:integration
```

## Important

These tests are **excluded from `npm test`** to keep unit tests fast.

- **Unit tests**: `npm test` (fast, no server needed)
- **Integration tests**: `npm run test:integration` (requires server)

## What's Tested

- Creating carts with different currencies
- Retrieving carts
- Adding items to carts
- Complete shopping workflows
- Error handling (400, 404)

For more details, see the [main README](../README.md#testing-strategy).
