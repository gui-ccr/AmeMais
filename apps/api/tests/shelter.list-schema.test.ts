import { describe, expect, it } from "vitest";
import { listSheltersQuerySchema } from "../src/features/lares/schema";

describe("listSheltersQuerySchema", () => {
  it("aceita todos os parâmetros válidos", () => {
    const result = listSheltersQuerySchema.safeParse({
      status: "disponivel",
      busca: "Centro",
      comVagas: "true",
      limit: "10",
      offset: "20",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        status: "disponivel",
        busca: "Centro",
        comVagas: true,
        limit: 10,
        offset: 20,
      });
    }
  });

  it("aplica os valores padrão quando todos os parâmetros estão ausentes", () => {
    const result = listSheltersQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBeUndefined();
      expect(result.data.busca).toBeUndefined();
      expect(result.data.comVagas).toBeUndefined();
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it("trata busca vazia ou só espaços como ausente (sem filtro)", () => {
    const vazia = listSheltersQuerySchema.safeParse({ busca: "" });
    const espacos = listSheltersQuerySchema.safeParse({ busca: "   " });

    expect(vazia.success).toBe(true);
    if (vazia.success) expect(vazia.data.busca).toBeUndefined();
    expect(espacos.success).toBe(true);
    if (espacos.success) expect(espacos.data.busca).toBeUndefined();
  });

  it("apara espaços de uma busca válida", () => {
    const result = listSheltersQuerySchema.safeParse({ busca: "  Centro  " });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.busca).toBe("Centro");
  });

  it("rejeita status fora da lista permitida", () => {
    const result = listSheltersQuerySchema.safeParse({ status: "fechado" });
    expect(result.success).toBe(false);
  });

  it("converte comVagas='true' para true e 'false' para false", () => {
    const comTrue = listSheltersQuerySchema.safeParse({ comVagas: "true" });
    const comFalse = listSheltersQuerySchema.safeParse({ comVagas: "false" });

    expect(comTrue.success).toBe(true);
    if (comTrue.success) expect(comTrue.data.comVagas).toBe(true);
    expect(comFalse.success).toBe(true);
    if (comFalse.success) expect(comFalse.data.comVagas).toBe(false);
  });

  it("rejeita comVagas com qualquer valor que não seja exatamente 'true' ou 'false'", () => {
    expect(listSheltersQuerySchema.safeParse({ comVagas: "1" }).success).toBe(false);
    expect(listSheltersQuerySchema.safeParse({ comVagas: "yes" }).success).toBe(false);
    expect(listSheltersQuerySchema.safeParse({ comVagas: "True" }).success).toBe(false);
    expect(listSheltersQuerySchema.safeParse({ comVagas: "" }).success).toBe(false);
  });

  it("rejeita limit/offset negativos, não numéricos ou acima do máximo", () => {
    expect(listSheltersQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
    expect(listSheltersQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
    expect(listSheltersQuerySchema.safeParse({ limit: "abc" }).success).toBe(false);
    expect(listSheltersQuerySchema.safeParse({ offset: "-1" }).success).toBe(false);
  });

  it("aceita offset 0 (início da listagem)", () => {
    const result = listSheltersQuerySchema.safeParse({ offset: "0" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.offset).toBe(0);
  });

  it("rejeita limit/offset vazios em vez de usar o padrão silenciosamente", () => {
    expect(listSheltersQuerySchema.safeParse({ limit: "" }).success).toBe(false);
    expect(listSheltersQuerySchema.safeParse({ offset: "" }).success).toBe(false);
  });
});
