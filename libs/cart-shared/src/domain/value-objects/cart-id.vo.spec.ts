import { CartId } from './cart-id.vo'

describe('CartId', () => {
  describe('generate', () => {
    it('should generate a valid UUID v4', () => {
      const cartId = CartId.generate()
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      expect(cartId.value).toMatch(uuidV4Regex)
    })

    it('should generate unique IDs', () => {
      const cartId1 = CartId.generate()
      const cartId2 = CartId.generate()

      expect(cartId1.value).not.toBe(cartId2.value)
    })
  })

  describe('from', () => {
    it('should create CartId from valid UUID v4', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000'
      const cartId = CartId.from(uuid)

      expect(cartId.value).toBe(uuid)
    })

    it('should throw error for invalid UUID format', () => {
      const invalidIds = [
        'not-a-uuid',
        '12345',
        '',
        '123e4567-e89b-12d3-a456-42661417400', // too short
        '123e4567-e89b-12d3-a456-4266141740000', // too long
        '123e4567-e89b-52d3-a456-426614174000', // wrong version (5 instead of 4)
        '123e4567-e89b-12d3-c456-426614174000' // wrong variant (c instead of 8,9,a,b)
      ]

      invalidIds.forEach(invalidId => {
        expect(() => CartId.from(invalidId)).toThrow(
          `Invalid cart ID format: ${invalidId}. Must be a valid UUID v4.`
        )
      })
    })
  })

  describe('value', () => {
    it('should return the raw UUID string', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000'
      const cartId = CartId.from(uuid)

      expect(cartId.value).toBe(uuid)
    })
  })

  describe('equals', () => {
    it('should return true for same cart ID values', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000'
      const cartId1 = CartId.from(uuid)
      const cartId2 = CartId.from(uuid)

      expect(cartId1.equals(cartId2)).toBe(true)
    })

    it('should return false for different cart ID values', () => {
      const cartId1 = CartId.from('123e4567-e89b-42d3-a456-426614174000')
      const cartId2 = CartId.from('223e4567-e89b-42d3-a456-426614174000')

      expect(cartId1.equals(cartId2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the UUID string', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000'
      const cartId = CartId.from(uuid)

      expect(cartId.toString()).toBe(uuid)
    })
  })
})
