/**
 * WirePort function type
 * Used to initialize port dependencies before lambda execution
 */
export type WirePort<T = void> = (props?: T) => void
