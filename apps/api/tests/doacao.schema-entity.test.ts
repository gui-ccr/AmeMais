import { describe, expect, it } from "vitest";
import { createDoacaoSchema, updateDoacaoSchema } from "../src/features/doacoes/schema";
import { Doacao } from "../src/features/doacoes/domain/doacao.entity";
import { mapRowToEntity, mapUpdateDTOToRow } from "../src/features/doacoes/mapper";
import { ValidationError } from "../src/core/errors";

const valida = {
  descricao: "6 sacos de ração",
  quantidade: 90,
  unidade: "kg",
  categoria: "racao",
  localColeta: "Pet Shop Amigo Fiel",
  dataEntrada: "2026-10-01",
};

describe("createDoacaoSchema", () => {
  it("aceita o mínimo e preenche os opcionais com null", () => {
    const r = createDoacaoSchema.parse(valida);
    expect(r).toMatchObject({ urlFoto: null, urgenciaId: null, doadorNome: null, doadorTelefone: null, doadorCpf: null });
  });

  it("transforma textos vazios do doador em null", () => {
    expect(createDoacaoSchema.parse({ ...valida, doadorNome: "  ", doadorCpf: "" }).doadorNome).toBeNull();
  });

  it("recusa quantidade não positiva, unidade/categoria desconhecidas e CPF inválido", () => {
    expect(createDoacaoSchema.safeParse({ ...valida, quantidade: 0 }).success).toBe(false);
    expect(createDoacaoSchema.safeParse({ ...valida, unidade: "m" }).success).toBe(false);
    expect(createDoacaoSchema.safeParse({ ...valida, categoria: "x" }).success).toBe(false);
    expect(createDoacaoSchema.safeParse({ ...valida, doadorCpf: "111.111.111-11" }).success).toBe(false);
    expect(createDoacaoSchema.safeParse({ ...valida, urgenciaId: "abc" }).success).toBe(false);
  });

  it("aceita CPF válido", () => {
    expect(createDoacaoSchema.safeParse({ ...valida, doadorCpf: "529.982.247-25" }).success).toBe(true);
  });
});

describe("updateDoacaoSchema", () => {
  it("não preenche defaults: só o que foi enviado", () => {
    expect(updateDoacaoSchema.parse({ descricao: "Nova descrição" })).toEqual({ descricao: "Nova descrição" });
  });

  it("aceita null para limpar foto e urgência", () => {
    expect(updateDoacaoSchema.parse({ urlFoto: null, urgenciaId: null })).toEqual({ urlFoto: null, urgenciaId: null });
  });

  it("recusa corpo vazio", () => {
    expect(updateDoacaoSchema.safeParse({}).success).toBe(false);
  });

  it("mapUpdateDTOToRow só inclui o que mudou", () => {
    expect(mapUpdateDTOToRow({ localColeta: "Centro", urlFoto: null })).toEqual({ local_coleta: "Centro", foto_url: null });
  });
});

describe("Doacao (entidade)", () => {
  const row = {
    id: "5b0f4f6e-0b1f-4c53-9a54-2f2d3d4c1a11",
    descricao: "Mantas",
    quantidade: "14",
    unidade: "un",
    categoria: "cobertores",
    local_coleta: "Salão paroquial",
    data_entrada: "2026-09-28",
    foto_url: null,
    urgencia_id: null,
    nome_doador: null,
    telefone_doador: null,
    cpf_doador: null,
    registrado_por_nome: "Maria",
    created_at: "2026-09-28T12:10:00.000Z",
  };

  it("restaura convertendo quantidade numeric (string) em número", () => {
    expect(mapRowToEntity(row).quantidade).toBe(14);
  });

  it("update aplica as mudanças e preserva a auditoria", () => {
    const doacao = mapRowToEntity(row);
    doacao.update({ quantidade: 20 });
    expect(doacao.quantidade).toBe(20);
    expect(doacao.registradoPor).toBe("Maria");
    expect(doacao.createdAt).toBe(row.created_at);
  });

  it("update recusa estado inválido", () => {
    const doacao = mapRowToEntity(row);
    expect(() => doacao.update({ quantidade: -1 })).toThrow(ValidationError);
    expect(() => doacao.update({ dataEntrada: "2999-01-01" })).toThrow(ValidationError);
  });

  it("create recusa data no futuro", () => {
    expect(() =>
      Doacao.create({
        ...createDoacaoSchema.parse(valida),
        dataEntrada: "2999-01-01",
      }),
    ).toThrow(ValidationError);
  });
});
