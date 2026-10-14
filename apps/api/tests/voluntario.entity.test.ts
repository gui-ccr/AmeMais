import { describe, expect, it } from "vitest";
import { Voluntario, type NewVoluntarioProps } from "../src/features/voluntarios/domain/voluntario.entity";
import { StatusVoluntario } from "../src/features/voluntarios/domain/status-voluntario.vo";
import { ValidationError } from "../src/core/errors";

function inputValido(overrides: Partial<NewVoluntarioProps> = {}): NewVoluntarioProps {
  return {
    nome: "Maria Silva",
    email: "maria@exemplo.com",
    telefone: "33998765432",
    tipo: "apoio_geral",
    bairro: "Centro",
    areasDeAjuda: ["eventos", "divulgacao"],
    ...overrides,
  };
}

describe("Voluntario.create() — nome", () => {
  it("aceita nome com exatamente 2 letras", () => {
    const result = Voluntario.create(inputValido({ nome: "Jo" }));
    expect(result.nome).toBe("Jo");
  });

  it("aceita nome com mais de 2 letras, inclusive com acentos e espaços", () => {
    const result = Voluntario.create(inputValido({ nome: "José André de Souza" }));
    expect(result.nome).toBe("José André de Souza");
  });

  it("rejeita nome vazio", () => {
    expect(() => Voluntario.create(inputValido({ nome: "" }))).toThrowError(ValidationError);
  });

  it("rejeita nome com apenas espaços", () => {
    expect(() => Voluntario.create(inputValido({ nome: "   " }))).toThrowError(ValidationError);
  });

  it("rejeita nome com menos de 2 letras", () => {
    expect(() => Voluntario.create(inputValido({ nome: "A" }))).toThrowError(ValidationError);
  });

  it("remove espaços nas extremidades do nome, como o resto do projeto já faz", () => {
    const result = Voluntario.create(inputValido({ nome: "  Maria Silva  " }));
    expect(result.nome).toBe("Maria Silva");
  });
});

describe("Voluntario.create() — telefone", () => {
  it("aceita telefone válido com 10 dígitos", () => {
    const result = Voluntario.create(inputValido({ telefone: "3398765432" }));
    expect(result.telefone).toBe("3398765432");
  });

  it("aceita telefone válido com 11 dígitos", () => {
    const result = Voluntario.create(inputValido({ telefone: "33998765432" }));
    expect(result.telefone).toBe("33998765432");
  });

  it("remove a máscara e guarda só os dígitos", () => {
    const result = Voluntario.create(inputValido({ telefone: "(33) 99876-5432" }));
    expect(result.telefone).toBe("33998765432");
    expect(result.telefone).toMatch(/^\d+$/);
  });

  it("rejeita telefone curto demais (9 dígitos)", () => {
    expect(() => Voluntario.create(inputValido({ telefone: "339876543" }))).toThrowError(ValidationError);
  });

  it("rejeita telefone longo demais (12 dígitos)", () => {
    expect(() => Voluntario.create(inputValido({ telefone: "339987654321" }))).toThrowError(ValidationError);
  });

  it("rejeita telefone com letras que resultam em quantidade inválida de dígitos", () => {
    expect(() => Voluntario.create(inputValido({ telefone: "33abc98765" }))).toThrowError(ValidationError);
  });
});

describe("Voluntario.create() — email", () => {
  it("aceita e-mail válido", () => {
    const result = Voluntario.create(inputValido({ email: "contato@amemais.org" }));
    expect(result.email).toBe("contato@amemais.org");
  });

  it("aceita email null (contrato permite omitir)", () => {
    const result = Voluntario.create(inputValido({ email: null }));
    expect(result.email).toBeNull();
  });

  it("aceita email undefined (campo ausente)", () => {
    const input = inputValido();
    delete input.email;
    const result = Voluntario.create(input);
    expect(result.email).toBeNull();
  });

  it("rejeita e-mail inválido em vez de transformá-lo silenciosamente em null", () => {
    expect(() => Voluntario.create(inputValido({ email: "nao-e-email" }))).toThrowError(ValidationError);
  });
});

describe("Voluntario.create() — áreas de ajuda", () => {
  it("aceita lista vazia", () => {
    const result = Voluntario.create(inputValido({ areasDeAjuda: [] }));
    expect(result.areasDeAjuda).toEqual([]);
  });

  it("aceita uma área válida", () => {
    const result = Voluntario.create(inputValido({ areasDeAjuda: ["transporte"] }));
    expect(result.areasDeAjuda.map((a) => a.valor)).toEqual(["transporte"]);
  });

  it("aceita várias áreas válidas", () => {
    const result = Voluntario.create(
      inputValido({ areasDeAjuda: ["lar_temporario", "transporte", "eventos", "divulgacao"] }),
    );
    expect(result.areasDeAjuda.map((a) => a.valor)).toEqual([
      "lar_temporario",
      "transporte",
      "eventos",
      "divulgacao",
    ]);
  });

  it("rejeita áreas duplicadas", () => {
    expect(() => Voluntario.create(inputValido({ areasDeAjuda: ["eventos", "eventos"] }))).toThrowError(
      ValidationError,
    );
  });

  it("rejeita área desconhecida", () => {
    expect(() => Voluntario.create(inputValido({ areasDeAjuda: ["financeiro"] }))).toThrowError(ValidationError);
  });

  it("rejeita lista com combinação de valores válidos e inválidos", () => {
    expect(() => Voluntario.create(inputValido({ areasDeAjuda: ["eventos", "financeiro"] }))).toThrowError(
      ValidationError,
    );
  });
});

describe("Voluntario.create() — tipo e status", () => {
  it("aceita tipo 'veterinario'", () => {
    const result = Voluntario.create(inputValido({ tipo: "veterinario" }));
    expect(result.tipo.valor).toBe("veterinario");
  });

  it("aceita tipo 'apoio_geral'", () => {
    const result = Voluntario.create(inputValido({ tipo: "apoio_geral" }));
    expect(result.tipo.valor).toBe("apoio_geral");
  });

  it("rejeita tipo inválido", () => {
    expect(() => Voluntario.create(inputValido({ tipo: "coordenador" as never }))).toThrowError(ValidationError);
  });

  it("todo voluntário novo nasce com status 'ativo'", () => {
    const result = Voluntario.create(inputValido());
    expect(result.status.valor).toBe("ativo");
  });
});

describe("Voluntario.create() — bairro e demais campos nulos", () => {
  it("aceita bairro null", () => {
    const result = Voluntario.create(inputValido({ bairro: null }));
    expect(result.bairro).toBeNull();
  });

  it("trata bairro vazio/só espaços como null", () => {
    const result = Voluntario.create(inputValido({ bairro: "   " }));
    expect(result.bairro).toBeNull();
  });

  it("aceita email e bairro nulos ao mesmo tempo", () => {
    const result = Voluntario.create(inputValido({ email: null, bairro: null }));
    expect(result.email).toBeNull();
    expect(result.bairro).toBeNull();
  });
});

describe("Voluntario.restore()", () => {
  it("reconstrói a entidade a partir de dados persistidos, incluindo status 'inativo'", () => {
    const criado = Voluntario.create(inputValido());
    const voluntario = Voluntario.restore({
      id: "vol-1",
      createdAt: "2026-10-13T00:00:00.000Z",
      ...criado,
      status: StatusVoluntario.from("inativo"),
    });

    expect(voluntario.id).toBe("vol-1");
    expect(voluntario.status.valor).toBe("inativo");
    expect(voluntario.createdAt).toBe("2026-10-13T00:00:00.000Z");
    expect(voluntario.nome).toBe("Maria Silva");
    expect(voluntario.areasDeAjuda.map((a) => a.valor)).toEqual(["eventos", "divulgacao"]);
  });
});
