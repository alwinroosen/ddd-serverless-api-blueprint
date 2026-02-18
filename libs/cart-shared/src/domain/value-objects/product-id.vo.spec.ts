import { ProductId } from './product-id.vo'

describe('ProductId', () => {
  describe('from', () => {
    it('should create ProductId from valid string', () => {
      const validIds = ['PROD-12345', 'ABC-123', 'PRODUCT-99999', 'A1B2C3', '123-456-789']

      validIds.forEach(id => {
        const productId = ProductId.from(id)
        expect(productId.value).toBe(id)
      })
    })

    it('should throw error for invalid format', () => {
      const invalidIds = [
        'ab', // too short (< 3 chars)
        'a' + 'b'.repeat(50), // too long (> 50 chars)
        'prod-123', // lowercase not allowed
        'PROD 123', // spaces not allowed
        'PROD_123', // underscores not allowed
        'PROD.123', // dots not allowed
        '', // empty string
        'PROD-123!' // special characters not allowed
      ]

      invalidIds.forEach(invalidId => {
        expect(() => ProductId.from(invalidId)).toThrow(
          `Invalid product ID format: ${invalidId}. Must be alphanumeric with hyphens, 3-50 characters.`
        )
      })
    })
  })

  describe('value', () => {
    it('should return the raw product ID string', () => {
      const id = 'PROD-12345'
      const productId = ProductId.from(id)

      expect(productId.value).toBe(id)
    })
  })

  describe('equals', () => {
    it('should return true for same product ID values', () => {
      const productId1 = ProductId.from('PROD-12345')
      const productId2 = ProductId.from('PROD-12345')

      expect(productId1.equals(productId2)).toBe(true)
    })

    it('should return false for different product ID values', () => {
      const productId1 = ProductId.from('PROD-12345')
      const productId2 = ProductId.from('PROD-67890')

      expect(productId1.equals(productId2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the product ID string', () => {
      const id = 'PROD-12345'
      const productId = ProductId.from(id)

      expect(productId.toString()).toBe(id)
    })
  })
})
