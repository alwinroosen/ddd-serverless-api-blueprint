/**
 * JWT payload extracted from Cognito token
 */
export type JwtPayload = {
  sub: string // User ID
  email?: string
  'cognito:username'?: string
  exp: number
  iat: number
}

/**
 * JwtPort
 *
 * Port (interface) for JWT verification and user extraction.
 * Abstracts Cognito JWT verification logic.
 */
export type JwtPort = {
  /**
   * Verify JWT token from Authorization header
   * @param token - JWT token (without 'Bearer ' prefix)
   * @returns JWT payload if valid
   * @throws {Error} If token is invalid or expired
   */
  verify: (token: string) => Promise<JwtPayload>

  /**
   * Extract user ID from JWT payload
   * @param payload - JWT payload
   * @returns User ID (sub claim)
   */
  getUserId: (payload: JwtPayload) => string
}
