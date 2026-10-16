/**
 * Erros de aplicação: toda camada (use case, repository, entidade,
 * middleware) deve lançar uma destas em vez de um Error genérico —
 * `core/http.ts` sabe converter qualquer uma delas na resposta HTTP certa.
 *
 * `message` é sempre o texto seguro que pode ir pro cliente. Erro real de
 * infra (Supabase, storage, etc.) nunca vira mensagem pública — quem
 * precisar dele pra log usa o `cause` nativo do Error, que nunca é
 * serializado na resposta HTTP.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;

  constructor(message = "Autenticação necessária") {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;

  constructor(message = "Você não tem permissão para esta ação") {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;

  constructor(resource: string) {
    super(`${resource} não encontrado`);
  }
}

/** Para violações de regras de unicidade (ex.: e-mail já cadastrado). */
export class ConflictError extends AppError {
  readonly statusCode = 409;

  constructor(message = "Conflito com o estado atual do recurso") {
    super(message);
  }
}

/**
 * Falha inesperada ao acessar o banco. A mensagem pro cliente é sempre a
 * mesma, fixa — o erro real do Supabase (nome de tabela/coluna, SQL etc.)
 * vai só pro `cause`, nunca pra resposta HTTP. Use em vez de propagar o
 * erro do Supabase direto (`if (error) throw error`).
 */
export class DatabaseError extends AppError {
  readonly statusCode = 500;

  constructor(cause?: unknown) {
    super("Erro ao acessar o banco de dados", cause);
  }
}

/** Mesma lógica do DatabaseError, para falhas de upload/remoção no Storage. */
export class StorageError extends AppError {
  readonly statusCode = 500;

  constructor(cause?: unknown) {
    super("Erro no armazenamento de arquivos", cause);
  }
}

/** Qualquer outra falha inesperada que não se encaixa nas categorias acima. */
export class InternalError extends AppError {
  readonly statusCode = 500;

  constructor(cause?: unknown) {
    super("Erro interno", cause);
  }
}
