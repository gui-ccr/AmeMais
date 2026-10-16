import { describe, expect, it } from "vitest";
import { createVoluntarioSchema, updateVoluntarioSchema } from "../src/features/voluntarios/schema";

function corpoValido(overrides: Record<string, unknown> = {}) {
  return {
    nome: "Maria Silva",
    email: "maria@exemplo.com",
    telefone: "(33) 99876-5432",
    tipo: "apoio_geral",
    bairro: "Centro",
    areasDeAjuda: ["eventos"],
    ...overrides,
  };
}

describe("updateVoluntarioSchema (PUT exige as chaves)", () => {
  it("aceita corpo completo, inclusive com email/bairro null e areasDeAjuda vazia", () => {
    expect(updateVoluntarioSchema.safeParse(corpoValido()).success).toBe(true);
    expect(
      updateVoluntarioSchema.safeParse(corpoValido({ email: null, bairro: null, areasDeAjuda: [] })).success,
    ).toBe(true);
  });

  it.each(["email", "bairro", "areasDeAjuda"])("rejeita corpo sem a chave %s", (chave) => {
    const corpo = corpoValido() as Record<string, unknown>;
    delete corpo[chave];
    expect(updateVoluntarioSchema.safeParse(corpo).success).toBe(false);
  });

  it("rejeita areasDeAjuda repetidas", () => {
    expect(updateVoluntarioSchema.safeParse(corpoValido({ areasDeAjuda: ["eventos", "eventos"] })).success).toBe(false);
  });
});

describe("createVoluntarioSchema", () => {
  it("aceita um corpo completo e válido", () => {
    const result = createVoluntarioSchema.safeParse(corpoValido());
    expect(result.success).toBe(true);
  });

  it("normaliza o telefone com máscara para somente dígitos", () => {
    const result = createVoluntarioSchema.safeParse(corpoValido({ telefone: "(33) 99876-5432" }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.telefone).toBe("33998765432");
  });

  it("rejeita telefone com quantidade inválida de dígitos, mesmo após normalizar", () => {
    const result = createVoluntarioSchema.safeParse(corpoValido({ telefone: "(33) 987-654" }));
    expect(result.success).toBe(false);
  });

  it("rejeita e-mail inválido", () => {
    const result = createVoluntarioSchema.safeParse(corpoValido({ email: "nao-e-email" }));
    expect(result.success).toBe(false);
  });

  it("aceita email ausente (contrato permite omitir)", () => {
    const corpo = corpoValido();
    delete (corpo as Record<string, unknown>).email;
    const result = createVoluntarioSchema.safeParse(corpo);
    expect(result.success).toBe(true);
  });

  it("preserva null em email e bairro", () => {
    const result = createVoluntarioSchema.safeParse(corpoValido({ email: null, bairro: null }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
      expect(result.data.bairro).toBeNull();
    }
  });

  it("rejeita areasDeAjuda duplicadas", () => {
    const result = createVoluntarioSchema.safeParse(corpoValido({ areasDeAjuda: ["eventos", "eventos"] }));
    expect(result.success).toBe(false);
  });

  it("rejeita areasDeAjuda com valor fora dos 4 permitidos", () => {
    const result = createVoluntarioSchema.safeParse(corpoValido({ areasDeAjuda: ["financeiro"] }));
    expect(result.success).toBe(false);
  });

  it("aceita areasDeAjuda ausente, assumindo lista vazia", () => {
    const corpo = corpoValido();
    delete (corpo as Record<string, unknown>).areasDeAjuda;
    const result = createVoluntarioSchema.safeParse(corpo);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.areasDeAjuda).toEqual([]);
  });

  it("rejeita tipo fora dos 2 valores permitidos", () => {
    const result = createVoluntarioSchema.safeParse(corpoValido({ tipo: "coordenador" }));
    expect(result.success).toBe(false);
  });

  it("rejeita nome com menos de 2 caracteres", () => {
    const result = createVoluntarioSchema.safeParse(corpoValido({ nome: "A" }));
    expect(result.success).toBe(false);
  });
});
