/**
 * API Integration Tests
 *
 * These tests make actual HTTP requests to the local API server.
 *
 * Prerequisites:
 * 1. Start the API server: npm start
 * 2. Run these tests: npm run test:integration
 *
 * Tests cover:
 * - Full HTTP request/response cycle
 * - API Gateway simulation
 * - Lambda handler execution
 * - DynamoDB interactions
 * - Request validation
 * - Error handling
 */

import axios, { AxiosError } from 'axios'

const API_BASE_URL = 'http://localhost:3000'
const API_PATH = '/api/v1'

// Helper to create axios instance with defaults
const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PATH}`,
  validateStatus: () => true // Don't throw on non-2xx responses
})

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await axios.get(`${API_BASE_URL}/health`)

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({
        status: 'healthy',
        environment: 'local',
        jwtVerificationDisabled: true
      })
    })
  })

  describe('POST /cart - Create Cart', () => {
    it('should create a new cart with EUR currency', async () => {
      const response = await api.post('/cart', {
        currency: 'EUR'
      })

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({
        userId: 'test-user-123',
        currency: 'EUR',
        items: [],
        status: 'ACTIVE',
        itemCount: 0,
        total: {
          amount: 0,
          currency: 'EUR'
        }
      })
      expect(response.data.cartId).toBeDefined()
      expect(response.data.createdAt).toBeDefined()
      expect(response.data.updatedAt).toBeDefined()
    })

    it('should create a new cart with USD currency', async () => {
      const response = await api.post('/cart', {
        currency: 'USD'
      })

      expect(response.status).toBe(201)
      expect(response.data.currency).toBe('USD')
      expect(response.data.total.currency).toBe('USD')
    })

    it('should create a cart with default EUR when currency not specified', async () => {
      const response = await api.post('/cart', {})

      expect(response.status).toBe(201)
      expect(response.data.currency).toBe('EUR')
    })

    it('should reject invalid currency', async () => {
      const response = await api.post('/cart', {
        currency: 'INVALID'
      })

      expect(response.status).toBe(400)
      expect(response.data.error).toBeDefined()
    })
  })

  describe('GET /cart/:cartId - Get Cart', () => {
    let testCartId: string

    beforeEach(async () => {
      // Create a test cart
      const createResponse = await api.post('/cart', { currency: 'EUR' })
      testCartId = createResponse.data.cartId
    })

    it('should retrieve an existing cart', async () => {
      const response = await api.get(`/cart/${testCartId}`)

      expect(response.status).toBe(200)
      expect(response.data.cartId).toBe(testCartId)
      expect(response.data.userId).toBe('test-user-123')
      expect(response.data.currency).toBe('EUR')
    })

    it('should return 404 for non-existent cart', async () => {
      // Use a valid UUID v4 that doesn't exist (not the null UUID)
      const fakeCartId = '12345678-1234-4234-8234-123456789012'
      const response = await api.get(`/cart/${fakeCartId}`)

      expect(response.status).toBe(404)
      expect(response.data.error).toBeDefined()
    })

    it('should return 400 for invalid cart ID format', async () => {
      const response = await api.get('/cart/invalid-uuid')

      expect(response.status).toBe(400)
      expect(response.data.error).toBeDefined()
      expect(response.data.message).toContain('Invalid uuid')
    })

    it('should return 400 for null UUID (00000000-0000-0000-0000-000000000000)', async () => {
      const response = await api.get('/cart/00000000-0000-0000-0000-000000000000')

      expect(response.status).toBe(400)
      expect(response.data.error).toBeDefined()
    })
  })

  describe('POST /cart/:cartId/items - Add Item', () => {
    let testCartId: string

    beforeEach(async () => {
      // Create a test cart
      const createResponse = await api.post('/cart', { currency: 'EUR' })
      testCartId = createResponse.data.cartId
    })

    it('should add a single item to cart', async () => {
      const response = await api.post(`/cart/${testCartId}/items`, {
        productId: 'PROD-001',
        quantity: 2
      })

      expect(response.status).toBe(200)
      expect(response.data.cartId).toBe(testCartId)
      expect(response.data.items).toHaveLength(1)
      expect(response.data.items[0]).toMatchObject({
        productId: 'PROD-001',
        productName: 'Premium Widget',
        quantity: 2,
        unitPrice: {
          amount: 29.99,
          currency: 'EUR'
        },
        lineTotal: {
          amount: 59.98,
          currency: 'EUR'
        }
      })
      expect(response.data.total).toMatchObject({
        amount: 59.98,
        currency: 'EUR'
      })
      expect(response.data.itemCount).toBe(2)
    })

    it('should add multiple different items to cart', async () => {
      // Add first item
      await api.post(`/cart/${testCartId}/items`, {
        productId: 'PROD-001',
        quantity: 2
      })

      // Add second item
      const response = await api.post(`/cart/${testCartId}/items`, {
        productId: 'PROD-002',
        quantity: 1
      })

      expect(response.status).toBe(200)
      expect(response.data.items).toHaveLength(2)
      expect(response.data.itemCount).toBe(3) // 2 + 1
      expect(response.data.total.amount).toBe(75.48) // (29.99 * 2) + (15.50 * 1)
    })

    it('should increase quantity when adding same product twice', async () => {
      // Add product first time
      await api.post(`/cart/${testCartId}/items`, {
        productId: 'PROD-001',
        quantity: 2
      })

      // Add same product again
      const response = await api.post(`/cart/${testCartId}/items`, {
        productId: 'PROD-001',
        quantity: 3
      })

      expect(response.status).toBe(200)
      expect(response.data.items).toHaveLength(1)
      expect(response.data.items[0].quantity).toBe(5) // 2 + 3
      expect(response.data.itemCount).toBe(5)
      expect(response.data.total.amount).toBe(149.95) // 29.99 * 5
    })

    it('should return 404 for non-existent product', async () => {
      const response = await api.post(`/cart/${testCartId}/items`, {
        productId: 'PROD-999',
        quantity: 1
      })

      expect(response.status).toBe(404)
      expect(response.data.error).toBeDefined()
    })

    it('should return 404 for non-existent cart', async () => {
      // Use a valid UUID v4 that doesn't exist (not the null UUID)
      const fakeCartId = '12345678-1234-4234-8234-123456789012'
      const response = await api.post(`/cart/${fakeCartId}/items`, {
        productId: 'PROD-001',
        quantity: 1
      })

      expect(response.status).toBe(404)
      expect(response.data.error).toBeDefined()
    })

    it('should return 400 for invalid quantity', async () => {
      const response = await api.post(`/cart/${testCartId}/items`, {
        productId: 'PROD-001',
        quantity: 0 // Invalid: must be >= 1
      })

      expect(response.status).toBe(400)
      expect(response.data.error).toBeDefined()
    })

    it('should return 400 for missing productId', async () => {
      const response = await api.post(`/cart/${testCartId}/items`, {
        quantity: 1
        // Missing productId
      })

      expect(response.status).toBe(400)
      expect(response.data.error).toBeDefined()
    })
  })

  describe('Complete Shopping Flow', () => {
    it('should complete a full shopping cart workflow', async () => {
      // 1. Create cart
      const createResponse = await api.post('/cart', {
        currency: 'EUR'
      })
      expect(createResponse.status).toBe(201)
      const cartId = createResponse.data.cartId

      // 2. Verify cart is empty
      const getEmptyResponse = await api.get(`/cart/${cartId}`)
      expect(getEmptyResponse.status).toBe(200)
      expect(getEmptyResponse.data.items).toHaveLength(0)
      expect(getEmptyResponse.data.total.amount).toBe(0)

      // 3. Add Premium Widget (€29.99 x 2)
      const addItem1Response = await api.post(`/cart/${cartId}/items`, {
        productId: 'PROD-001',
        quantity: 2
      })
      expect(addItem1Response.status).toBe(200)
      expect(addItem1Response.data.total.amount).toBe(59.98)

      // 4. Add Standard Gadget (€15.50 x 1)
      const addItem2Response = await api.post(`/cart/${cartId}/items`, {
        productId: 'PROD-002',
        quantity: 1
      })
      expect(addItem2Response.status).toBe(200)
      expect(addItem2Response.data.total.amount).toBe(75.48)

      // 5. Add Budget Tool (€9.99 x 3)
      const addItem3Response = await api.post(`/cart/${cartId}/items`, {
        productId: 'PROD-003',
        quantity: 3
      })
      expect(addItem3Response.status).toBe(200)
      expect(addItem3Response.data.total.amount).toBe(105.45)

      // 6. Get final cart state
      const getFinalResponse = await api.get(`/cart/${cartId}`)
      expect(getFinalResponse.status).toBe(200)
      expect(getFinalResponse.data.items).toHaveLength(3)
      expect(getFinalResponse.data.itemCount).toBe(6) // 2 + 1 + 3
      expect(getFinalResponse.data.total).toMatchObject({
        amount: 105.45,
        currency: 'EUR'
      })

      // Verify all items
      const items = getFinalResponse.data.items
      expect(items.find((i: any) => i.productId === 'PROD-001').quantity).toBe(2)
      expect(items.find((i: any) => i.productId === 'PROD-002').quantity).toBe(1)
      expect(items.find((i: any) => i.productId === 'PROD-003').quantity).toBe(3)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await axios.post(`${API_BASE_URL}${API_PATH}/cart`, 'invalid-json', {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true
      })

      expect([400, 500]).toContain(response.status)
    })

    it('should return 404 for non-existent routes', async () => {
      const response = await api.get('/non-existent-route')

      expect(response.status).toBe(404)
      expect(response.data.error).toBeDefined()
    })
  })

  describe('Test Products Availability', () => {
    let testCartId: string

    beforeEach(async () => {
      const createResponse = await api.post('/cart', { currency: 'EUR' })
      testCartId = createResponse.data.cartId
    })

    it('should have PROD-001 (Premium Widget) available', async () => {
      const response = await api.post(`/cart/${testCartId}/items`, {
        productId: 'PROD-001',
        quantity: 1
      })

      expect(response.status).toBe(200)
      expect(response.data.items[0]).toMatchObject({
        productId: 'PROD-001',
        productName: 'Premium Widget',
        unitPrice: { amount: 29.99, currency: 'EUR' }
      })
    })

    it('should have PROD-002 (Standard Gadget) available', async () => {
      const response = await api.post(`/cart/${testCartId}/items`, {
        productId: 'PROD-002',
        quantity: 1
      })

      expect(response.status).toBe(200)
      expect(response.data.items[0]).toMatchObject({
        productId: 'PROD-002',
        productName: 'Standard Gadget',
        unitPrice: { amount: 15.5, currency: 'EUR' }
      })
    })

    it('should have PROD-003 (Budget Tool) available', async () => {
      const response = await api.post(`/cart/${testCartId}/items`, {
        productId: 'PROD-003',
        quantity: 1
      })

      expect(response.status).toBe(200)
      expect(response.data.items[0]).toMatchObject({
        productId: 'PROD-003',
        productName: 'Budget Tool',
        unitPrice: { amount: 9.99, currency: 'EUR' }
      })
    })
  })
})
