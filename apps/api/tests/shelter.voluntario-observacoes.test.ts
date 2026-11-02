import { describe, expect, it } from "vitest";
import { mapCreateDTOToRow, mapEntityDadosToRow, mapRowToEntity, type ShelterRow } from "../src/features/lares/mapper";
import { createShelterSchema, updateShelterSchema } from "../src/features/lares/schema";
import { toShelterDetailDTO, toShelterDTO } from "../src/features/lares/shelter.dto";

const VOLUNTARIO_ID = "33333333-3333-4333-8333-333333333333";

const base = { nomeResponsavel: "Maria Silva", contato: "33999990000", capacidade: 2, enderecoRegiao: "Centro" };

function row(overrides: Partial<ShelterRow> = {}): ShelterRow {
  return {
    id: "lar-1",
    nome_responsavel: "Maria Silva",
    contato: "33999990000",
    capacidade: 2,
    status: "disponivel",
    endereco_regiao: "Centro",
    aceita_gatos: true,
    aceita_cachorros: false,
    observacoes: null,
    voluntario_id: null,
    is_active: true,
    created_at: "2026-10-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("lares — observações e voluntário responsável (KAN-87, KAN-100)", () => {
  it("cadastro sem observações nem voluntário continua valendo", () => {
    const dados = createShelterSchema.parse(base);
    expect(dados.observacoes).toBeUndefined();
    expect(dados.voluntarioId).toBeUndefined();
    expect(mapCreateDTOToRow(dados)).toMatchObject({ observacoes: null, voluntario_id: null });
  });

  it("cadastro aceita observações e voluntarioId, e grava em snake_case", () => {
    const dados = createShelterSchema.parse({ ...base, observacoes: "  Tem quintal  ", voluntarioId: VOLUNTARIO_ID });
    expect(mapCreateDTOToRow(dados)).toMatchObject({ observacoes: "Tem quintal", voluntario_id: VOLUNTARIO_ID });
  });

  it("recusa voluntarioId que não é uuid e observações longas demais", () => {
    expect(createShelterSchema.safeParse({ ...base, voluntarioId: "abc" }).success).toBe(false);
    expect(createShelterSchema.safeParse({ ...base, observacoes: "x".repeat(1001) }).success).toBe(false);
  });

  it("edição aceita voluntarioId null para desvincular", () => {
    expect(updateShelterSchema.parse({ voluntarioId: null })).toEqual({ voluntarioId: null });
    expect(updateShelterSchema.safeParse({ voluntarioId: "abc" }).success).toBe(false);
  });

  it("mapper lê as colunas novas e devolve null quando vazias", () => {
    const vazio = mapRowToEntity(row());
    expect(vazio.observacoes).toBeNull();
    expect(vazio.voluntarioId).toBeNull();

    const cheio = mapRowToEntity(row({ observacoes: "Tem quintal", voluntario_id: VOLUNTARIO_ID }));
    expect(mapEntityDadosToRow(cheio)).toMatchObject({ observacoes: "Tem quintal", voluntario_id: VOLUNTARIO_ID });
    expect(toShelterDTO(cheio)).toMatchObject({ observacoes: "Tem quintal", voluntarioId: VOLUNTARIO_ID });
  });

  it("detalhe devolve o voluntário resumido (ou null)", () => {
    const lar = mapRowToEntity(row({ voluntario_id: VOLUNTARIO_ID }));
    expect(toShelterDetailDTO(lar, [], { id: VOLUNTARIO_ID, nome: "João" }).voluntario).toEqual({
      id: VOLUNTARIO_ID,
      nome: "João",
    });
    expect(toShelterDetailDTO(lar, []).voluntario).toBeNull();
  });
});
