import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "../src/core/errors";
import type { NextRequest } from "next/server";
import { created, fail, lerCorpoJson, ok } from "../src/core/http";

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

describe("lerCorpoJson", () => {
  it("devolve o corpo quando o JSON é válido", async () => {
    const request = { json: async () => ({ a: 1 }) } as unknown as NextRequest;
    await expect(lerCorpoJson(request)).resolves.toEqual({ a: 1 });
  });

  it("corpo vazio/malformado vira ValidationError (400), não erro interno", async () => {
    const request = new Request("https://api.test", { method: "POST", body: "{quebrado" }) as unknown as NextRequest;
    await expect(lerCorpoJson(request)).rejects.toThrowError(ValidationError);
    expect(fail(new ValidationError("JSON inválido")).status).toBe(400);
  });
});
