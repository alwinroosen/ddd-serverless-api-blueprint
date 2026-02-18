import type { ConfigPort } from '../../application/ports/ConfigPort'
import type { JwtPort } from '../../application/ports/JwtPort'
import { jwtAdapter } from '../../infrastructure/jwtAdapter'
import type { WirePort } from '../wirePort'

let jwtPort: JwtPort | undefined = undefined

export const wireJwtPort: WirePort<[ConfigPort]> = props => {
  if (!props) {
    throw new Error('ConfigPort is required for wiring JwtPort')
  }
  const [configPort] = props
  jwtPort ??= jwtAdapter(configPort)
}

export const getJwtPort = (): JwtPort => {
  if (!jwtPort) {
    throw new Error('Wiring was not done for getJwtPort!')
  }
  return jwtPort
}
