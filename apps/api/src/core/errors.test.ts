import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "./errors";

describe("AppError", () => {
  it("UnauthorizedError usa statusCode 401", () => {
    const error = new UnauthorizedError("Token ausente");
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Token ausente");
  });

  it("ForbiddenError usa statusCode 403", () => {
    expect(new ForbiddenError("Sem permissão").statusCode).toBe(403);
  });

  it("ValidationError usa statusCode 400", () => {
    expect(new ValidationError("Campo inválido").statusCode).toBe(400);
  });

  it("NotFoundError usa statusCode 404 e monta a mensagem a partir do recurso", () => {
    const error = new NotFoundError("Animal");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Animal não encontrado");
  });
});
