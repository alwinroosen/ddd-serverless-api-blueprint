import type { LoggerPort } from '../../application/ports/LoggerPort'
import { loggerAdapter } from '../../infrastructure/loggerAdapter'
import type { WirePort } from '../wirePort'

let loggerPort: LoggerPort | undefined = undefined

export const wireLoggerPort: WirePort<[]> = () => {
  // Get log level from environment (defaults to 'info')
  const logLevel = process.env.LOG_LEVEL || 'info'
  loggerPort ??= loggerAdapter(logLevel)
}

export const getLoggerPort = (): LoggerPort => {
  if (!loggerPort) {
    throw new Error('Wiring was not done for getLoggerPort!')
  }
  return loggerPort
}
