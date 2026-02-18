/**
 * Get current deployment stage from environment
 * @returns Stage name (e.g., 'dev', 'staging', 'prod')
 */
export const getStage = (): string => {
  return process.env.STAGE || 'local'
}
