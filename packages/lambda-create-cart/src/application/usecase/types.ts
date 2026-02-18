/**
 * Base Presenter interface
 *
 * All presenters must implement this interface.
 * T is the success response type.
 */
export type Presenter<T> = {
  success: (data: T) => void
  serverError: (error: Error | string) => void
  notFound: (message: string) => void
  unauthorized: (message: string) => void
  badRequest: (message: string) => void
}

/**
 * UseCase type
 *
 * Factory function that creates a use case.
 * Takes presenter and ports as dependencies, returns object with handle method.
 */
export type UseCase<TInput, TPresenter, TPorts extends unknown[]> = (
  presenter: TPresenter,
  ports: TPorts
) => {
  handle: (input: TInput) => Promise<void>
}
