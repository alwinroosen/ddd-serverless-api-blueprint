/**
 * API Contracts - Public API
 *
 * Single source of truth for API contracts
 * Following IT Handbook contract-first pattern
 */

// Types
export * from './types/endpoint.types'

// Schemas
export * from './schemas/common.schemas'
export * from './schemas/create-cart.schemas'
export * from './schemas/get-cart.schemas'
export * from './schemas/add-item.schemas'

// Endpoint definitions
import { createCartEndpoint } from './endpoints/create-cart.endpoint'
import { getCartEndpoint } from './endpoints/get-cart.endpoint'
import { addItemToCartEndpoint } from './endpoints/add-item.endpoint'

export { createCartEndpoint, getCartEndpoint, addItemToCartEndpoint }

// Endpoint registry for generation scripts
export const endpoints = [createCartEndpoint, getCartEndpoint, addItemToCartEndpoint] as const
