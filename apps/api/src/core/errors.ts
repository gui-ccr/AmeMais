/**
 * Erros de aplicação: toda camada (service, repository, middleware) deve
 * lançar uma destas em vez de Error genérico. `core/http.ts` sabe converter
 * qualquer uma delas na resposta HTTP correta.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;

  constructor(resource: string) {
    super(`${resource} não encontrado`);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
}
