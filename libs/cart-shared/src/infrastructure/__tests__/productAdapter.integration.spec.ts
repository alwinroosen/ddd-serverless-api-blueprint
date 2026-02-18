/**
 * Integration tests for ProductAdapter
 */

import { productAdapter } from '../productAdapter'
import { dynamoDBAdapter } from '../dynamoDBAdapter'
import { ProductId } from '../../domain'
import type { ConfigPort } from '../../application/ports/ConfigPort'
import type { LoggerPort } from '../../application/ports/LoggerPort'

const mockConfigPort: ConfigPort = {
  getTableName: () => 'test-products-table',
  getRegion: () => 'us-east-1',
  getUserPoolId: () => 'test-pool',
  getClientId: () => 'test-client',
  getStage: () => 'test',
  getAllowedOrigins: () => ['http://localhost:3000']
}

const mockLoggerPort: LoggerPort = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  setCorrelationId: jest.fn(),
  getCorrelationId: jest.fn()
}

describe('ProductAdapter Integration Tests', () => {
  describe.skip('with DynamoDB Local', () => {
    let adapter: ReturnType<typeof productAdapter>

    beforeEach(() => {
      const databasePort = dynamoDBAdapter(mockConfigPort, mockLoggerPort)
      adapter = productAdapter(mockConfigPort, databasePort)
    })

    it('should find product by ID', async () => {
      // This test would require seeding test data
      const productId = ProductId.from('PROD-TEST-001')
      const product = await adapter.findById(productId)

      expect(product.productId.value).toBe('PROD-TEST-001')
      expect(product.isActive).toBe(true)
    })

    it('should find multiple products by IDs', async () => {
      const ids = [ProductId.from('PROD-001'), ProductId.from('PROD-002')]
      const products = await adapter.findByIds(ids)

      expect(products.size).toBeGreaterThan(0)
      expect(products.has('PROD-001')).toBe(true)
    })

    it('should list active products with pagination', async () => {
      const result = await adapter.listActive(10)

      expect(result.products.length).toBeLessThanOrEqual(10)
      expect(result.products.every(p => p.isActive)).toBe(true)
    })

    it('should throw ProductNotFoundError for non-existent product', async () => {
      const productId = ProductId.from('PROD-NONEXISTENT')

      await expect(adapter.findById(productId)).rejects.toThrow('PRODUCT_NOT_FOUND')
    })

    it('should throw ProductNotActiveError for inactive product', async () => {
      // Assumes test data with inactive product
      const productId = ProductId.from('PROD-INACTIVE')

      await expect(adapter.findById(productId)).rejects.toThrow('PRODUCT_NOT_ACTIVE')
    })
  })
})
