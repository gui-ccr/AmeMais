import { describe, expect, it } from "vitest";
import { createAnimalSchema } from "../src/features/animals/schema";

const ADOTANTE_VALIDO = {
  nome: "João Silva",
  idade: 30,
  cep: "39800000",
  localidade: "Teófilo Otoni",
};

describe("createAnimalSchema", () => {
  it("deve aceitar um corpo de animal adotado completo e válido", () => {
    const result = createAnimalSchema.safeParse({
      nome: "Rex",
      especie: "Cachorro",
      raca: "Labrador",
      status: "adotado",
      adotante: ADOTANTE_VALIDO,
      dataAdocao: "2026-09-20",
    });

    expect(result.success).toBe(true);
  });

  it("deve aceitar um animal não adotado sem adotante nem dataAdocao", () => {
    const result = createAnimalSchema.safeParse({ nome: "Rex", status: "disponivel" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.adotante).toBeUndefined();
      expect(result.data.dataAdocao).toBeUndefined();
    }
  });

  it("deve rejeitar dataAdocao fora do formato YYYY-MM-DD", () => {
    const result = createAnimalSchema.safeParse({
      nome: "Rex",
      status: "adotado",
      adotante: ADOTANTE_VALIDO,
      dataAdocao: "20/09/2026",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("dataAdocao"))).toBe(true);
    }
  });

  it("deve rejeitar idade do adotante decimal ou fora da faixa 1-120", () => {
    const decimal = createAnimalSchema.safeParse({
      nome: "Rex",
      status: "adotado",
      adotante: { ...ADOTANTE_VALIDO, idade: 18.5 },
      dataAdocao: "2026-09-20",
    });
    const zero = createAnimalSchema.safeParse({
      nome: "Rex",
      status: "adotado",
      adotante: { ...ADOTANTE_VALIDO, idade: 0 },
      dataAdocao: "2026-09-20",
    });

    expect(decimal.success).toBe(false);
    expect(zero.success).toBe(false);
  });

  it("deve rejeitar CEP que não tenha exatamente 8 números", () => {
    const result = createAnimalSchema.safeParse({
      nome: "Rex",
      status: "adotado",
      adotante: { ...ADOTANTE_VALIDO, cep: "1234567" },
      dataAdocao: "2026-09-20",
    });

    expect(result.success).toBe(false);
  });

  it("deve rejeitar status inválido (fora do enum ANIMAL_STATUSES)", () => {
    const result = createAnimalSchema.safeParse({ nome: "Rex", status: "inexistente" });

    expect(result.success).toBe(false);
  });

  it("já aceitava 'adotado' como status válido antes desta tarefa (regressão)", () => {
    const result = createAnimalSchema.safeParse({ nome: "Rex", status: "adotado", adotante: ADOTANTE_VALIDO, dataAdocao: "2026-09-20" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("adotado");
  });
});
