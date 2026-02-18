import { CognitoJwtVerifier } from 'aws-jwt-verify'
import type { ConfigPort } from '../application/ports/ConfigPort'
import type { JwtPort, JwtPayload } from '../application/ports/JwtPort'

/**
 * JwtAdapter
 *
 * Adapter implementation for JwtPort using AWS Cognito JWT verification.
 *
 * Following IT Handbook standards:
 * - Use official AWS library for JWT verification
 * - Validate token signature and expiration
 * - Clear error messages for invalid tokens
 *
 * Local Development Mode:
 * - Set DISABLE_JWT_VERIFICATION=true to bypass verification
 * - Returns mock payload for local testing (NEVER use in production)
 */
export const jwtAdapter = (configPort: ConfigPort): JwtPort => {
  const isLocalMode = process.env.DISABLE_JWT_VERIFICATION === 'true'

  // Create verifier instance (singleton per adapter) - only if not in local mode
  const verifier = isLocalMode
    ? null
    : CognitoJwtVerifier.create({
        userPoolId: configPort.getUserPoolId(),
        tokenUse: 'access',
        clientId: configPort.getClientId()
      })

  return {
    verify: async (token: string): Promise<JwtPayload> => {
      // Local development bypass (NEVER use in production)
      if (isLocalMode) {
        console.warn(
          '⚠️  JWT verification disabled for local development. NEVER use in production!'
        )
        // Return mock payload for local testing
        return {
          sub: 'test-user-123',
          'cognito:username': 'testuser',
          token_use: 'access',
          auth_time: Math.floor(Date.now() / 1000),
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600
        } as JwtPayload
      }

      try {
        const payload = await verifier!.verify(token)
        return payload as JwtPayload
      } catch (error) {
        throw new Error(`Invalid JWT token: ${(error as Error).message}`, {
          cause: error
        })
      }
    },

    getUserId: (payload: JwtPayload): string => {
      return payload.sub
    }
  }
}
