import { describe, expect, it } from "vitest";
import { listVoluntariosQuerySchema } from "../src/features/voluntarios/schema";

describe("listVoluntariosQuerySchema", () => {
  it("aceita todos os parâmetros válidos", () => {
    const result = listVoluntariosQuerySchema.safeParse({
      busca: "Ana",
      tipo: "veterinario",
      status: "ativo",
      area: "transporte",
      page: "2",
      limit: "10",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        busca: "Ana",
        tipo: "veterinario",
        status: "ativo",
        area: "transporte",
        page: 2,
        limit: 10,
      });
    }
  });

  it("aplica os valores padrão quando todos os parâmetros estão ausentes", () => {
    const result = listVoluntariosQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.busca).toBeUndefined();
      expect(result.data.tipo).toBeUndefined();
      expect(result.data.status).toBeUndefined();
      expect(result.data.area).toBeUndefined();
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("trata busca vazia ou só espaços como ausente (sem filtro), não como erro", () => {
    const vazia = listVoluntariosQuerySchema.safeParse({ busca: "" });
    const espacos = listVoluntariosQuerySchema.safeParse({ busca: "   " });

    expect(vazia.success).toBe(true);
    if (vazia.success) expect(vazia.data.busca).toBeUndefined();
    expect(espacos.success).toBe(true);
    if (espacos.success) expect(espacos.data.busca).toBeUndefined();
  });

  it("apara espaços de uma busca válida", () => {
    const result = listVoluntariosQuerySchema.safeParse({ busca: "  Ana Silva  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.busca).toBe("Ana Silva");
  });

  it("rejeita tipo fora da lista permitida", () => {
    const result = listVoluntariosQuerySchema.safeParse({ tipo: "coordenador" });
    expect(result.success).toBe(false);
  });

  it("rejeita status fora da lista permitida", () => {
    const result = listVoluntariosQuerySchema.safeParse({ status: "pendente" });
    expect(result.success).toBe(false);
  });

  it("rejeita area fora da lista permitida", () => {
    const result = listVoluntariosQuerySchema.safeParse({ area: "financeiro" });
    expect(result.success).toBe(false);
  });

  it("rejeita page igual a zero ou negativo", () => {
    expect(listVoluntariosQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(listVoluntariosQuerySchema.safeParse({ page: "-1" }).success).toBe(false);
  });

  it("rejeita page não numérico", () => {
    const result = listVoluntariosQuerySchema.safeParse({ page: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejeita limit igual a zero, negativo ou acima do máximo (100)", () => {
    expect(listVoluntariosQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
    expect(listVoluntariosQuerySchema.safeParse({ limit: "-5" }).success).toBe(false);
    expect(listVoluntariosQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });

  it("aceita limit no limite máximo (100)", () => {
    const result = listVoluntariosQuerySchema.safeParse({ limit: "100" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(100);
  });

  it("rejeita page/limit vazios em vez de usar o padrão silenciosamente", () => {
    expect(listVoluntariosQuerySchema.safeParse({ page: "" }).success).toBe(false);
    expect(listVoluntariosQuerySchema.safeParse({ limit: "" }).success).toBe(false);
  });
});
