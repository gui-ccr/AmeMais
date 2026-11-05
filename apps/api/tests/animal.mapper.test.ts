import { describe, expect, it } from "vitest";
import { mapRowToEntity, mapCreateDTOToRow, type AnimalRow } from "../src/features/animals/mapper";
import { ValidationError } from "../src/core/errors";
import { Animal } from "../src/features/animals/domain/animal.entity";
import type { CreateAnimalDTO } from "../src/features/animals/schema";

function baseRow(overrides: Partial<AnimalRow> = {}): AnimalRow {
  return {
    id: "animal-1",
    nome: "Rex",
    especie: "Cachorro",
    raca: "Labrador",
    status_adocao: "disponivel",
    lar_temporario_id: null,
    adotante_id: null,
    adotante_nome: null,
    adotante_idade: null,
    adotante_cep: null,
    adotante_localidade: null,
    url_foto: null, porte: "M", faixa_etaria: "adulto", idade_texto: null, descricao: null,
    data_adocao: null,
    created_at: "2026-09-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("animals mapper", () => {
  describe("mapRowToEntity", () => {
    it("deve mapear uma linha sem adotante para adotante: null", () => {
      const entity = mapRowToEntity(baseRow());

      expect(entity.adotante).toBeNull();
      expect(entity.dataAdocao).toBeNull();
    });

    it("deve mapear as 4 colunas adotante_* para o objeto adotante da entidade", () => {
      const row = baseRow({
        status_adocao: "adotado",
        adotante_nome: "João Silva",
        adotante_idade: 30,
        adotante_cep: "39800000",
        adotante_localidade: "Teófilo Otoni",
        data_adocao: "2026-09-20",
      });

      const entity = mapRowToEntity(row);

      expect(entity.adotante).toEqual({
        nome: "João Silva",
        idade: 30,
        cep: "39800000",
        localidade: "Teófilo Otoni",
      });
      expect(entity.dataAdocao).toBe("2026-09-20");
    });

    it("deve falhar alto (ValidationError) se a linha tiver dados de adotante parcialmente preenchidos", () => {
      const row = baseRow({ adotante_nome: "João Silva", adotante_idade: null });

      expect(() => mapRowToEntity(row)).toThrowError(ValidationError);
    });
  });

  describe("mapCreateDTOToRow", () => {
    it("deve converter adotante e dataAdocao para as colunas snake_case", () => {
      const input: CreateAnimalDTO = {
        nome: "Rex",
        especie: "Cachorro",
        raca: "Labrador",
        status: "adotado",
        adotante: { nome: "João Silva", idade: 30, cep: "39800000", localidade: "Teófilo Otoni" },
        dataAdocao: "2026-09-20",
      };

      // O mapper recebe os dados JÁ validados e normalizados por Animal.create().
      const row = mapCreateDTOToRow(Animal.create(input));

      expect(row).toEqual({
        nome: "Rex",
        especie: "Cachorro",
        raca: "Labrador",
        status_adocao: "adotado",
        porte: "M",
        faixa_etaria: "adulto",
        idade_texto: null,
        descricao: null,
        url_foto: null,
        adotante_nome: "João Silva",
        adotante_idade: 30,
        adotante_cep: "39800000",
        adotante_localidade: "Teófilo Otoni",
        data_adocao: "2026-09-20",
      });
    });

    it("deve gravar null nas colunas adotante_* e data_adocao quando não há adotante", () => {
      const input: CreateAnimalDTO = { nome: "Rex", status: "disponivel" };

      // O mapper recebe os dados JÁ validados e normalizados por Animal.create().
      const row = mapCreateDTOToRow(Animal.create(input));

      expect(row.adotante_nome).toBeNull();
      expect(row.adotante_idade).toBeNull();
      expect(row.adotante_cep).toBeNull();
      expect(row.adotante_localidade).toBeNull();
      expect(row.data_adocao).toBeNull();
    });
  });
});
