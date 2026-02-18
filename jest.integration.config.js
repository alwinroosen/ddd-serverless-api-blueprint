/**
 * Jest configuration for API Integration Tests
 *
 * These tests run against the local API server (http://localhost:3000)
 * and test the full HTTP request/response cycle.
 *
 * IMPORTANT:
 * - Integration tests are EXCLUDED from `npm test` (unit tests)
 * - They are located in the /tests folder (ignored by jest.preset.js)
 * - They run ONLY via `npm run test:integration`
 *
 * Prerequisites:
 * 1. Start API server: npm start
 * 2. Run tests: npm run test:integration
 */

module.exports = {
  displayName: 'API Integration Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.integration.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'libs/*/src/**/*.ts',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!**/node_modules/**'
  ],
  coverageDirectory: '<rootDir>/coverage/integration',
  testTimeout: 30000, // 30 seconds for HTTP requests
  verbose: true,
  bail: false, // Continue running tests even if some fail
  maxWorkers: 1 // Run tests sequentially to avoid conflicts
}
