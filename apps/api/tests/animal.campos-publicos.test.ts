import { describe, expect, it } from "vitest";
import { NotFoundError, ValidationError } from "../src/core/errors";
import type { IAnimalRepository } from "../src/features/animals/animal.repository";
import { Animal, type AnimalCreationData } from "../src/features/animals/domain/animal.entity";
import { mapCreateDTOToRow, mapDadosToRow, mapRowToEntity, type AnimalRow } from "../src/features/animals/mapper";
import { createAnimalSchema, updateAnimalSchema } from "../src/features/animals/schema";
import { CreateAnimalUseCase } from "../src/features/animals/use-cases/create-animal.use-case";
import { UpdateAnimalUseCase } from "../src/features/animals/use-cases/update-animal.use-case";

/** Repository em memória: grava exatamente o que recebe, como o real. */
class FakeAnimalRepository implements IAnimalRepository {
  items: Animal[] = [];

  async list() {
    return [...this.items];
  }
  async findById(id: string) {
    const item = this.items.find((a) => a.id === id);
    if (!item) throw new NotFoundError("Animal");
    return item;
  }
  async create(input: AnimalCreationData) {
    const animal = Animal.restore({ id: "novo", createdAt: "2026-10-01T00:00:00.000Z", ...input });
    this.items.push(animal);
    return animal;
  }
  async updateStatus(animal: Animal) {
    return animal;
  }
  async updateDados(animal: Animal) {
    return animal;
  }
  async remove() {}
  async findLaresResumo() {
    return new Map();
  }
}

const DADOS_VALIDOS = {
  nome: "Thor",
  especie: "Cachorro",
  raca: "SRD",
  porte: "G",
  faixaEtaria: "filhote",
  idadeTexto: "3 meses",
  descricao: "Brincalhão e dócil.",
} as const;

describe("Animais: porte, faixa etária, idade e descrição", () => {
  describe("createAnimalSchema", () => {
    it("aceita porte G, faixa filhote, idade e descrição", () => {
      const resultado = createAnimalSchema.safeParse({ ...DADOS_VALIDOS });

      expect(resultado.success).toBe(true);
    });

    it("continua aceitando o cadastro sem os 4 campos (valem os padrões do banco)", () => {
      expect(createAnimalSchema.safeParse({ nome: "Rex" }).success).toBe(true);
    });

    it.each([
      ["porte", "GG"],
      ["porte", "g"],
      ["faixaEtaria", "bebe"],
      ["idadeTexto", "x".repeat(41)],
      ["descricao", "x".repeat(501)],
    ])("rejeita %s inválido (%s) com erro do Zod, sem chegar ao banco", (campo, valor) => {
      const resultado = createAnimalSchema.safeParse({ ...DADOS_VALIDOS, [campo]: valor });

      expect(resultado.success).toBe(false);
      if (!resultado.success) expect(resultado.error.issues[0]?.path).toEqual([campo]);
    });

    it("aceita idadeTexto de 40 e descricao de 500 caracteres (os limites do banco)", () => {
      const resultado = createAnimalSchema.safeParse({
        ...DADOS_VALIDOS,
        idadeTexto: "x".repeat(40),
        descricao: "x".repeat(500),
      });

      expect(resultado.success).toBe(true);
    });
  });

  describe("CreateAnimalUseCase", () => {
    it("salva e devolve porte G, faixa filhote, idade e descrição", async () => {
      const repository = new FakeAnimalRepository();
      const input = createAnimalSchema.parse({ ...DADOS_VALIDOS });

      const dto = await new CreateAnimalUseCase(repository).execute(input);

      expect(dto).toMatchObject({
        porte: "G",
        faixaEtaria: "filhote",
        idadeTexto: "3 meses",
        descricao: "Brincalhão e dócil.",
      });
      expect(repository.items[0]?.porte).toBe("G");
    });

    it("sem os campos, o animal nasce M/adulto e sem texto", async () => {
      const repository = new FakeAnimalRepository();

      const dto = await new CreateAnimalUseCase(repository).execute(createAnimalSchema.parse({ nome: "Rex" }));

      expect(dto).toMatchObject({ porte: "M", faixaEtaria: "adulto", idadeTexto: null, descricao: null });
    });

    it("texto só com espaços vira null", async () => {
      const repository = new FakeAnimalRepository();
      const input = createAnimalSchema.parse({ nome: "Rex", idadeTexto: "   ", descricao: "  " });

      const dto = await new CreateAnimalUseCase(repository).execute(input);

      expect(dto.idadeTexto).toBeNull();
      expect(dto.descricao).toBeNull();
    });
  });

  describe("updateAnimalSchema", () => {
    it("aceita os dados completos e rejeita porte/faixa fora da lista", () => {
      expect(updateAnimalSchema.safeParse({ ...DADOS_VALIDOS }).success).toBe(true);
      expect(updateAnimalSchema.safeParse({ ...DADOS_VALIDOS, porte: "X" }).success).toBe(false);
      expect(updateAnimalSchema.safeParse({ ...DADOS_VALIDOS, faixaEtaria: "senior" }).success).toBe(false);
    });

    it("exige porte e faixa etária (o PUT substitui os dados)", () => {
      const semPorte: Record<string, unknown> = { ...DADOS_VALIDOS };
      delete semPorte.porte;

      expect(updateAnimalSchema.safeParse(semPorte).success).toBe(false);
    });

    it("aceita idadeTexto e descricao null para apagar o texto", () => {
      expect(updateAnimalSchema.safeParse({ ...DADOS_VALIDOS, idadeTexto: null, descricao: null }).success).toBe(true);
    });
  });

  describe("UpdateAnimalUseCase", () => {
    async function repositorioComAnimal() {
      const repository = new FakeAnimalRepository();
      await new CreateAnimalUseCase(repository).execute(createAnimalSchema.parse({ nome: "Rex", especie: "Gato" }));
      return repository;
    }

    it("atualiza os dados e mantém o status", async () => {
      const repository = await repositorioComAnimal();

      const dto = await new UpdateAnimalUseCase(repository).execute("novo", updateAnimalSchema.parse(DADOS_VALIDOS));

      expect(dto).toMatchObject({ ...DADOS_VALIDOS, status: "disponivel" });
    });

    it("sem idadeTexto/descricao, apaga o que havia", async () => {
      const repository = await repositorioComAnimal();
      const useCase = new UpdateAnimalUseCase(repository);
      await useCase.execute("novo", updateAnimalSchema.parse(DADOS_VALIDOS));

      const semTextos: Record<string, unknown> = { ...DADOS_VALIDOS };
      delete semTextos.idadeTexto;
      delete semTextos.descricao;
      const dto = await useCase.execute("novo", updateAnimalSchema.parse(semTextos));

      expect(dto.idadeTexto).toBeNull();
      expect(dto.descricao).toBeNull();
    });

    it("devolve NotFound para animal inexistente", async () => {
      await expect(
        new UpdateAnimalUseCase(new FakeAnimalRepository()).execute("nao-existe", updateAnimalSchema.parse(DADOS_VALIDOS)),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("a entidade também barra valores fora da lista (defesa além do Zod)", async () => {
      const repository = await repositorioComAnimal();
      const animal = await repository.findById("novo");

      expect(() => animal.update({ ...DADOS_VALIDOS, porte: "XL" })).toThrowError(ValidationError);
      expect(() => animal.update({ ...DADOS_VALIDOS, descricao: "x".repeat(501) })).toThrowError(ValidationError);
    });
  });

  describe("mapper", () => {
    const row: AnimalRow = {
      id: "a1",
      nome: "Thor",
      especie: "Cachorro",
      raca: "SRD",
      porte: "G",
      faixa_etaria: "filhote",
      idade_texto: "3 meses",
      descricao: "Brincalhão e dócil.",
      status_adocao: "disponivel",
      lar_temporario_id: null,
      adotante_id: null,
      url_foto: null,
      data_adocao: null,
      adotante_nome: null,
      adotante_idade: null,
      adotante_cep: null,
      adotante_localidade: null,
      created_at: "2026-10-01T00:00:00.000Z",
    };

    it("lê as 4 colunas para a entidade e escreve de volta nas colunas snake_case", () => {
      const animal = mapRowToEntity(row);

      expect(animal).toMatchObject({ porte: "G", faixaEtaria: "filhote", idadeTexto: "3 meses" });
      expect(mapDadosToRow(animal)).toMatchObject({
        porte: "G",
        faixa_etaria: "filhote",
        idade_texto: "3 meses",
        descricao: "Brincalhão e dócil.",
      });
    });

    it("mapCreateDTOToRow grava as 4 colunas", () => {
      const dados = Animal.create({ ...DADOS_VALIDOS });

      expect(mapCreateDTOToRow(dados)).toMatchObject({
        porte: "G",
        faixa_etaria: "filhote",
        idade_texto: "3 meses",
        descricao: "Brincalhão e dócil.",
      });
    });
  });
});
