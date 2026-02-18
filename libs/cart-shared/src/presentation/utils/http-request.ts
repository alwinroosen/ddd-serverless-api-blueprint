/**
 * HTTP Request Utilities
 *
 * Common utilities for parsing and extracting data from API Gateway HTTP events.
 */

/**
 * Extract JWT token from Authorization header
 *
 * @param event - API Gateway event with headers
 * @returns JWT token without Bearer prefix
 * @throws Error if Authorization header is missing
 */
export const extractToken = (event: { headers: Record<string, string | undefined> }): string => {
  const authHeader = event.headers.Authorization || event.headers.authorization

  if (!authHeader) {
    throw new Error('JWT: Missing Authorization header')
  }

  // Remove 'Bearer ' prefix if present
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
}

/**
 * Parse request body JSON
 *
 * @param body - Raw request body string
 * @returns Parsed JSON object
 * @throws Error if body is missing or invalid JSON
 */
export const parseBody = (body: string | null | undefined): unknown => {
  if (!body) {
    throw new Error('Missing request body')
  }

  try {
    return JSON.parse(body)
  } catch {
    throw new Error('Invalid JSON in request body')
  }
}
