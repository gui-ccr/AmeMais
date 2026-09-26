import { describe, expect, it } from "vitest";
import { Animal } from "../src/features/animals/domain/animal.entity";
import { AnimalStatus } from "../src/features/animals/domain/animal-status.vo";
import type { IAnimalRepository } from "../src/features/animals/animal.repository";
import type { CreateAnimalDTO } from "../src/features/animals/schema";
import { CreateAnimalUseCase } from "../src/features/animals/use-cases/create-animal.use-case";
import { UpdateAnimalStatusUseCase } from "../src/features/animals/use-cases/update-animal-status.use-case";
import { NotFoundError, ValidationError } from "../src/core/errors";

class FakeAnimalRepository implements IAnimalRepository {
  public items: Animal[] = [];
  public lastCreateInput: CreateAnimalDTO | null = null;
  public lastUpdateStatusAnimal: Animal | null = null;

  async list(): Promise<Animal[]> {
    return [...this.items];
  }

  async findById(id: string): Promise<Animal> {
    const item = this.items.find((a) => a.id === id);
    if (!item) throw new NotFoundError("Animal");
    return item;
  }

  // Espelha o repository real: grava exatamente o que recebe, sem rechamar
  // Animal.create() (essa responsabilidade é do use case).
  async create(input: CreateAnimalDTO): Promise<Animal> {
    this.lastCreateInput = input;
    const animal = Animal.restore({
      id: "fake-uuid-1",
      nome: input.nome,
      especie: input.especie ?? null,
      raca: input.raca ?? null,
      status: AnimalStatus.from(input.status ?? "disponivel"),
      urlFoto: input.urlFoto ?? null,
      larTemporarioId: null,
      adotanteId: null,
      adotante: input.adotante ?? null,
      dataAdocao: input.dataAdocao ?? null,
      createdAt: "2026-09-20T00:00:00.000Z",
    });
    this.items.push(animal);
    return animal;
  }

  async updateStatus(animal: Animal): Promise<Animal> {
    this.lastUpdateStatusAnimal = animal;
    const index = this.items.findIndex((a) => a.id === animal.id);
    this.items[index] = animal;
    return animal;
  }

  async remove(): Promise<void> {}
}

describe("Use Cases: Animal", () => {
  describe("CreateAnimalUseCase", () => {
    it("deve repassar adotante e dataAdocao do input para a entidade e para o repository", async () => {
      const repository = new FakeAnimalRepository();
      const useCase = new CreateAnimalUseCase(repository);
      const input: CreateAnimalDTO = {
        nome: "Rex",
        especie: "Cachorro",
        raca: "Labrador",
        status: "adotado",
        urlFoto: "https://exemplo.com/rex.png",
        adotante: { nome: "João Silva", idade: 30, cep: "39800000", localidade: "Teófilo Otoni" },
        dataAdocao: "2026-09-20",
      };

      const result = await useCase.execute(input);

      expect(repository.lastCreateInput?.adotante).toEqual(input.adotante);
      expect(repository.lastCreateInput?.dataAdocao).toBe("2026-09-20");
      expect(result.adotante).toEqual(input.adotante);
      expect(result.dataAdocao).toBe("2026-09-20");
    });

    it("deve rejeitar (via Animal.create) um animal adotado sem dados do adotante, sem persistir", async () => {
      const repository = new FakeAnimalRepository();
      const useCase = new CreateAnimalUseCase(repository);
      const input: CreateAnimalDTO = { nome: "Rex", status: "adotado" };

      await expect(useCase.execute(input)).rejects.toThrowError(ValidationError);
      expect(repository.items.length).toBe(0);
    });
  });

  describe("UpdateAnimalStatusUseCase", () => {
    it("deve chamar repository.updateStatus com a entidade já sem adotante/dataAdocao após a devolução", async () => {
      const repository = new FakeAnimalRepository();
      repository.items.push(
        Animal.restore({
          id: "animal-1",
          nome: "Rex",
          especie: "Cachorro",
          raca: "Labrador",
          status: AnimalStatus.from("adotado"),
          urlFoto: "https://exemplo.com/rex.png",
          larTemporarioId: null,
          adotanteId: null,
          adotante: { nome: "João Silva", idade: 30, cep: "39800000", localidade: "Teófilo Otoni" },
          dataAdocao: "2026-09-20",
          createdAt: "2026-09-20T00:00:00.000Z",
        }),
      );

      const useCase = new UpdateAnimalStatusUseCase(repository);
      const result = await useCase.execute("animal-1", "disponivel");

      expect(repository.lastUpdateStatusAnimal?.adotante).toBeNull();
      expect(repository.lastUpdateStatusAnimal?.dataAdocao).toBeNull();
      expect(result.status).toBe("disponivel");
      expect(result.adotante).toBeNull();
      expect(result.dataAdocao).toBeNull();
    });
  });
});
