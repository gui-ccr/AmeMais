import { describe, expect, it } from "vitest";
import { createEventSchema, updateEventSchema } from "../src/features/events/schema";

describe("Event schemas", () => {
  it("PATCH aceita null em descricao e dataEvento (limpar o campo)", () => {
    const parsed = updateEventSchema.parse({ descricao: null, dataEvento: null });

    expect(parsed.descricao).toBeNull();
    expect(parsed.dataEvento).toBeNull();
  });

  it("PATCH sem os campos deixa ambos ausentes (não alterar)", () => {
    const parsed = updateEventSchema.parse({ titulo: "Novo título" });

    expect(parsed).toEqual({ titulo: "Novo título" });
  });

  it("PATCH continua rejeitando data inválida", () => {
    expect(() => updateEventSchema.parse({ dataEvento: "não é data" })).toThrow();
  });

  it("POST continua sem aceitar null nem descrição vazia", () => {
    expect(() => createEventSchema.parse({ titulo: "Feira", dataEvento: null })).toThrow();
    expect(() => createEventSchema.parse({ titulo: "Feira", descricao: "" })).toThrow();
  });
});
