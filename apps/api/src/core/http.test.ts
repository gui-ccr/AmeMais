import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "./errors";
import { created, fail, ok } from "./http";

describe("ok/created", () => {
  it("ok responde 200 com { data }", async () => {
    const response = ok({ hello: "world" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { hello: "world" } });
  });

  it("created responde 201 com { data }", async () => {
    const response = created({ id: "1" });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: { id: "1" } });
  });
});

describe("fail", () => {
  it("mapeia AppError pro statusCode e mensagem da própria classe", async () => {
    const response = fail(new NotFoundError("Animal"));
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Animal não encontrado" });
  });

  it("mapeia ZodError pra 400 com a lista de issues", async () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({});

    const response = fail(result.error);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Dados inválidos");
    expect(body.issues).toBeDefined();
  });

  it("mapeia qualquer outro erro pra 500 genérico, sem vazar detalhe interno", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = fail(new Error("detalhe interno sensível"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Erro interno" });

    vi.restoreAllMocks();
  });
});
