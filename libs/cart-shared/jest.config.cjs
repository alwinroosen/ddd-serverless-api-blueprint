const baseConfig = require('../../jest.preset')

module.exports = {
  ...baseConfig,
  displayName: 'cart-shared',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.ts', '<rootDir>/src/**/?(*.)+(spec|test).ts'],
  // Override collectCoverageFrom to exclude infrastructure/presentation layers
  // These require integration tests with AWS services or extensive mocking
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/node_modules/**',
    '!src/**/dist/**',
    '!src/**/coverage/**',
    // Exclude infrastructure adapters - require AWS SDK mocking
    '!src/infrastructure/**Adapter.ts',
    '!src/config/ports/*.ts',
    '!src/config/util/*.ts',
    // Exclude presentation layer - tested via Lambda handler tests
    '!src/presentation/**',
    // Exclude index files
    '!src/index.ts',
    '!src/domain/index.ts',
    '!src/application/index.ts'
  ]
}
