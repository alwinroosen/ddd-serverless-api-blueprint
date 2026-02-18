const { pathsToModuleNameMapper } = require('ts-jest')
const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')

/**
 * Jest preset for UNIT TESTS only
 *
 * This configuration is used for:
 * - npm test
 * - npm run test:coverage
 * - npm run affected:test
 *
 * Integration tests (in /tests folder) are EXCLUDED and run separately via:
 * - npm run test:integration (requires API server to be running)
 */

// Read tsconfig with comments support
const tsconfigPath = path.join(__dirname, 'tsconfig.base.json')
const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8')
const tsconfig = JSON5.parse(tsconfigContent)
const { compilerOptions } = tsconfig

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '<rootDir>/tests/' // Exclude integration tests folder
  ],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          ...compilerOptions,
          verbatimModuleSyntax: false
        }
      }
    ]
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/'
  }),
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.spec.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  bail: false,
  maxWorkers: '50%'
}
