import { describe, expect, it } from "vitest";
import { mapRowToEntity, mapCreateDTOToRow, type VoluntarioRow } from "../src/features/voluntarios/mapper";
import { Voluntario } from "../src/features/voluntarios/domain/voluntario.entity";

function rowFixture(overrides: Partial<VoluntarioRow> = {}): VoluntarioRow {
  return {
    id: "vol-1",
    nome: "Maria Silva",
    email: "maria@exemplo.com",
    telefone: "33998765432",
    tipo: "apoio_geral",
    bairro: "Centro",
    areas_de_ajuda: ["eventos", "divulgacao"],
    status: "ativo",
    created_at: "2026-10-13T00:00:00.000Z",
    ...overrides,
  };
}

describe("voluntarios mapper", () => {
  describe("mapRowToEntity", () => {
    it("converte a linha do banco (snake_case) para a entidade (camelCase + Value Objects)", () => {
      const entity = mapRowToEntity(rowFixture());

      expect(entity).toBeInstanceOf(Voluntario);
      expect(entity.id).toBe("vol-1");
      expect(entity.nome).toBe("Maria Silva");
      expect(entity.email).toBe("maria@exemplo.com");
      expect(entity.telefone).toBe("33998765432");
      expect(entity.tipo.valor).toBe("apoio_geral");
      expect(entity.bairro).toBe("Centro");
      expect(entity.areasDeAjuda.map((a) => a.valor)).toEqual(["eventos", "divulgacao"]);
      expect(entity.status.valor).toBe("ativo");
      expect(entity.createdAt).toBe("2026-10-13T00:00:00.000Z");
    });

    it("preserva email e bairro nulos", () => {
      const entity = mapRowToEntity(rowFixture({ email: null, bairro: null }));

      expect(entity.email).toBeNull();
      expect(entity.bairro).toBeNull();
    });

    it("preserva lista de áreas vazia", () => {
      const entity = mapRowToEntity(rowFixture({ areas_de_ajuda: [] }));

      expect(entity.areasDeAjuda).toEqual([]);
    });

    it("converte telefone NULL do banco (dado legado saneado) para string vazia, nunca inventando um número", () => {
      const entity = mapRowToEntity(rowFixture({ telefone: null }));

      expect(entity.telefone).toBe("");
    });
  });

  describe("mapCreateDTOToRow", () => {
    it("converte os dados já validados pela entidade para as colunas snake_case", () => {
      const data = Voluntario.create({
        nome: "Maria Silva",
        email: "maria@exemplo.com",
        telefone: "(33) 99876-5432",
        tipo: "apoio_geral",
        bairro: "Centro",
        areasDeAjuda: ["eventos", "divulgacao"],
      });

      const row = mapCreateDTOToRow(data);

      expect(row).toEqual({
        nome: "Maria Silva",
        email: "maria@exemplo.com",
        telefone: "33998765432",
        tipo: "apoio_geral",
        bairro: "Centro",
        areas_de_ajuda: ["eventos", "divulgacao"],
        status: "ativo",
      });
    });

    it("grava null em email/bairro e lista vazia em areas_de_ajuda quando não informados", () => {
      const data = Voluntario.create({
        nome: "João Souza",
        telefone: "33998765432",
        tipo: "veterinario",
      });

      const row = mapCreateDTOToRow(data);

      expect(row.email).toBeNull();
      expect(row.bairro).toBeNull();
      expect(row.areas_de_ajuda).toEqual([]);
    });
  });
});
