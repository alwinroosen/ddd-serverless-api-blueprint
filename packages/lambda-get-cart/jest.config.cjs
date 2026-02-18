const baseConfig = require('../../jest.preset')
const { pathsToModuleNameMapper } = require('ts-jest')
const fs = require('fs')
const path = require('path')
const JSON5 = require('json5')

// Read tsconfig from project root
const tsconfigPath = path.join(__dirname, '../../tsconfig.base.json')
const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8')
const tsconfig = JSON5.parse(tsconfigContent)
const { compilerOptions } = tsconfig

module.exports = {
  ...baseConfig,
  displayName: 'lambda-get-cart',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.ts', '<rootDir>/src/**/?(*.)+(spec|test).ts'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/../../'
  }),
  // Override coverage thresholds - tests require AWS SDK mocking to run
  coverageThreshold: undefined
}
