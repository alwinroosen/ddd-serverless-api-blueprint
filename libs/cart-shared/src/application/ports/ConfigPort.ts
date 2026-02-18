/**
 * ConfigPort
 *
 * Port (interface) for environment configuration access.
 * Provides configuration values needed by the application.
 */
export type ConfigPort = {
  /**
   * Get DynamoDB table name for carts
   * @returns Table name from environment
   */
  getTableName: () => string

  /**
   * Get AWS region
   * @returns AWS region (e.g., 'eu-west-1')
   */
  getRegion: () => string

  /**
   * Get Cognito user pool ID
   * @returns User pool ID
   */
  getUserPoolId: () => string

  /**
   * Get Cognito client ID
   * @returns Client ID
   */
  getClientId: () => string

  /**
   * Get current stage/environment
   * @returns Stage name (e.g., 'dev', 'prod')
   */
  getStage: () => string

  /**
   * Get allowed CORS origins
   * @returns Array of allowed origin URLs
   */
  getAllowedOrigins: () => string[]
}
