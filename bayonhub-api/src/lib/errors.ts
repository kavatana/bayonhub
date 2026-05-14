export type HttpError = Error & {
  status: number
}

export function createHttpError(status: number, message: string): HttpError {
  const error = new Error(message) as HttpError
  error.status = status
  return error
}

export const notFound = (message = "Not found") => createHttpError(404, message)
export const forbidden = (message = "Forbidden") => createHttpError(403, message)
export const badRequest = (message = "Bad request") => createHttpError(400, message)
export const unauthorized = (message = "Unauthorized") => createHttpError(401, message)
