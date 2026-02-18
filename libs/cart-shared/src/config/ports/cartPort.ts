import type { ConfigPort } from '../../application/ports/ConfigPort'
import type { DatabasePort } from '../../application/ports/DatabasePort'
import type { CartPort } from '../../application/ports/CartPort'
import { cartAdapter } from '../../infrastructure/cartAdapter'
import type { WirePort } from '../wirePort'

let cartPort: CartPort | undefined = undefined

export const wireCartPort: WirePort<[ConfigPort, DatabasePort]> = props => {
  if (!props) {
    throw new Error('ConfigPort and DatabasePort are required for wiring CartPort')
  }
  const [configPort, databasePort] = props
  cartPort ??= cartAdapter(configPort, databasePort)
}

export const getCartPort = (): CartPort => {
  if (!cartPort) {
    throw new Error('Wiring was not done for getCartPort!')
  }
  return cartPort
}
