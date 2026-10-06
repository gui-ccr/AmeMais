import { describe, expect, it, vi } from "vitest";
import { Adotante } from "../src/features/animals/domain/adotante.vo";
import { Animal, type AnimalCreationData } from "../src/features/animals/domain/animal.entity";
import { AnimalStatus } from "../src/features/animals/domain/animal-status.vo";
import type { IAnimalRepository } from "../src/features/animals/animal.repository";
import type { CreateAnimalDTO } from "../src/features/animals/schema";
import {
  CreateAnimalUseCase,
  type FotosDoAnimal,
} from "../src/features/animals/use-cases/create-animal.use-case";
import { UpdateAnimalStatusUseCase } from "../src/features/animals/use-cases/update-animal-status.use-case";
import { ListAnimalsUseCase } from "../src/features/animals/use-cases/list-animals.use-case";
import { GetAnimalUseCase } from "../src/features/animals/use-cases/get-animal.use-case";
import { DeleteAnimalUseCase } from "../src/features/animals/use-cases/delete-animal.use-case";
import { DatabaseError, InternalError, NotFoundError, ValidationError } from "../src/core/errors";

class FakeAnimalRepository implements IAnimalRepository {
  public items: Animal[] = [];
  public lastCreateInput: AnimalCreationData | null = null;
  public lastUpdateStatusAnimal: Animal | null = null;
  public removeCalled = false;

  async list(): Promise<Animal[]> {
    return [...this.items];
  }

  async findById(id: string): Promise<Animal> {
    const item = this.items.find((a) => a.id === id);
    if (!item) throw new NotFoundError("Animal");
    return item;
  }

  // Espelha o repository real: grava exatamente o que recebe (os dados já
  // normalizados por Animal.create()), sem revalidar.
  async create(input: AnimalCreationData): Promise<Animal> {
    this.lastCreateInput = input;
    const animal = Animal.restore({
      id: `fake-uuid-${this.items.length + 1}`,
      createdAt: "2026-09-20T00:00:00.000Z",
      ...input,
    });
    this.items.push(animal);
    return animal;
  }

  async updateStatus(animal: Animal): Promise<Animal> {
    this.lastUpdateStatusAnimal = animal;
    const index = this.items.findIndex((a) => a.id === animal.id);
    if (index === -1) throw new NotFoundError("Animal");
    this.items[index] = animal;
    return animal;
  }

  async remove(id: string): Promise<void> {
    this.removeCalled = true;
    const index = this.items.findIndex((a) => a.id === id);
    if (index === -1) throw new NotFoundError("Animal");
    this.items.splice(index, 1);
  }
}

describe("Use Cases: Animal", () => {
  describe("ListAnimalsUseCase", () => {
    it("deve retornar lista vazia quando não houver animais cadastrados", async () => {
      const repository = new FakeAnimalRepository();
      const useCase = new ListAnimalsUseCase(repository);

      const result = await useCase.execute();

      expect(result).toEqual([]);
    });

    it("deve retornar lista de animais mapeados para AnimalDTO", async () => {
      const repository = new FakeAnimalRepository();
      repository.items.push(
        Animal.restore({
          id: "animal-1",
          nome: "Bob",
          especie: "Cachorro",
          raca: "Poodle",
          status: AnimalStatus.from("disponivel"),
          urlFoto: "https://exemplo.com/bob.png",
          larTemporarioId: null,
          adotanteId: null,
          adotante: null,
          dataAdocao: null,
          createdAt: "2026-09-20T00:00:00.000Z",
        }),
      );
      const useCase = new ListAnimalsUseCase(repository);

      const result = await useCase.execute();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "animal-1",
        nome: "Bob",
        especie: "Cachorro",
        raca: "Poodle",
        status: "disponivel",
        urlFoto: "https://exemplo.com/bob.png",
        larTemporarioId: null,
        adotanteId: null,
        adotante: null,
        dataAdocao: null,
        createdAt: "2026-09-20T00:00:00.000Z",
      });
    });
  });

  describe("GetAnimalUseCase", () => {
    it("deve retornar o animal correspondente ao id informado como AnimalDTO", async () => {
      const repository = new FakeAnimalRepository();
      repository.items.push(
        Animal.restore({
          id: "animal-1",
          nome: "Bob",
          especie: "Cachorro",
          raca: "Poodle",
          status: AnimalStatus.from("disponivel"),
          urlFoto: null,
          larTemporarioId: null,
          adotanteId: null,
          adotante: null,
          dataAdocao: null,
          createdAt: "2026-09-20T00:00:00.000Z",
        }),
      );
      const useCase = new GetAnimalUseCase(repository);

      const result = await useCase.execute("animal-1");

      expect(result.id).toBe("animal-1");
      expect(result.nome).toBe("Bob");
      expect(result.status).toBe("disponivel");
    });

    it("deve lançar NotFoundError ao buscar por id inexistente", async () => {
      const repository = new FakeAnimalRepository();
      const useCase = new GetAnimalUseCase(repository);

      await expect(useCase.execute("nao-existe")).rejects.toThrowError(NotFoundError);
    });
  });

  describe("CreateAnimalUseCase", () => {
    it("deve cadastrar um animal comum (disponível) com sucesso", async () => {
      const repository = new FakeAnimalRepository();
      const useCase = new CreateAnimalUseCase(repository);
      const input: CreateAnimalDTO = {
        nome: "Pipoca",
        especie: "Gato",
        raca: "Siamês",
        status: "disponivel",
      };

      const result = await useCase.execute(input);

      expect(result.id).toBe("fake-uuid-1");
      expect(result.nome).toBe("Pipoca");
      expect(result.especie).toBe("Gato");
      expect(result.status).toBe("disponivel");
      expect(repository.items).toHaveLength(1);
      expect(repository.lastCreateInput?.nome).toBe("Pipoca");
    });

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

    it("deve enviar foto via FotosDoAnimal e associar urlFoto quando foto em bytes for fornecida", async () => {
      const repository = new FakeAnimalRepository();
      const fotos: FotosDoAnimal = {
        enviar: vi.fn(async () => ({
          url: "https://storage.exemplo.com/rex.jpg",
          path: "animais/rex.jpg",
        })),
        remover: vi.fn(async () => undefined),
      };
      const useCase = new CreateAnimalUseCase(repository, fotos);
      const input: CreateAnimalDTO = {
        nome: "Rex",
        especie: "Cachorro",
        raca: "Labrador",
        status: "adotado",
        adotante: { nome: "João Silva", idade: 30, cep: "39800000", localidade: "Teófilo Otoni" },
        dataAdocao: "2026-09-20",
      };
      const fotoBytes = new Uint8Array([1, 2, 3]);

      const result = await useCase.execute(input, fotoBytes);

      expect(fotos.enviar).toHaveBeenCalledWith(fotoBytes);
      expect(result.urlFoto).toBe("https://storage.exemplo.com/rex.jpg");
      expect(repository.lastCreateInput?.urlFoto).toBe("https://storage.exemplo.com/rex.jpg");
    });

    it("deve rejeitar se enviar foto como arquivo e urlFoto ao mesmo tempo", async () => {
      const repository = new FakeAnimalRepository();
      const useCase = new CreateAnimalUseCase(repository);
      const input: CreateAnimalDTO = {
        nome: "Rex",
        status: "disponivel",
        urlFoto: "https://exemplo.com/rex.png",
      };
      const fotoBytes = new Uint8Array([1, 2, 3]);

      await expect(useCase.execute(input, fotoBytes)).rejects.toThrowError(ValidationError);
      await expect(useCase.execute(input, fotoBytes)).rejects.toThrowError(
        "envie a foto como arquivo OU como urlFoto, não os dois",
      );
    });

    it("deve rejeitar se enviar foto como arquivo sem serviço FotosDoAnimal configurado", async () => {
      const repository = new FakeAnimalRepository();
      const useCase = new CreateAnimalUseCase(repository);
      const input: CreateAnimalDTO = {
        nome: "Rex",
        status: "disponivel",
      };
      const fotoBytes = new Uint8Array([1, 2, 3]);

      await expect(useCase.execute(input, fotoBytes)).rejects.toThrowError(InternalError);
      await expect(useCase.execute(input, fotoBytes)).rejects.toThrowError(
        "upload de foto não configurado",
      );
    });

    it("deve remover a foto do Storage se a persistência no repository falhar", async () => {
      const repository = new FakeAnimalRepository();
      const erroDb = new DatabaseError();
      vi.spyOn(repository, "create").mockRejectedValueOnce(erroDb);

      const fotos: FotosDoAnimal = {
        enviar: vi.fn(async () => ({
          url: "https://storage.exemplo.com/rex.jpg",
          path: "animais/rex.jpg",
        })),
        remover: vi.fn(async () => undefined),
      };
      const useCase = new CreateAnimalUseCase(repository, fotos);
      const input: CreateAnimalDTO = {
        nome: "Rex",
        especie: "Cachorro",
        raca: "SRD",
        status: "disponivel",
      };
      const fotoBytes = new Uint8Array([1, 2, 3]);

      await expect(useCase.execute(input, fotoBytes)).rejects.toBe(erroDb);
      expect(fotos.remover).toHaveBeenCalledWith("animais/rex.jpg");
    });

    it("deve rejeitar um animal adotado sem foto (nem arquivo, nem urlFoto), sem persistir", async () => {
      const repository = new FakeAnimalRepository();
      const useCase = new CreateAnimalUseCase(repository);
      const input: CreateAnimalDTO = {
        nome: "Rex",
        especie: "Cachorro",
        raca: "Labrador",
        status: "adotado",
        adotante: { nome: "João Silva", idade: 30, cep: "39800000", localidade: "Teófilo Otoni" },
        dataAdocao: "2026-09-20",
      };

      await expect(useCase.execute(input)).rejects.toThrowError(/foto é obrigatória/);
      expect(repository.items.length).toBe(0);
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
    it("deve atualizar status de um animal com sucesso (ex: disponivel -> em_tratamento)", async () => {
      const repository = new FakeAnimalRepository();
      repository.items.push(
        Animal.restore({
          id: "animal-1",
          nome: "Mel",
          especie: "Cachorro",
          raca: "SRD",
          status: AnimalStatus.from("disponivel"),
          urlFoto: null,
          larTemporarioId: null,
          adotanteId: null,
          adotante: null,
          dataAdocao: null,
          createdAt: "2026-09-20T00:00:00.000Z",
        }),
      );
      const useCase = new UpdateAnimalStatusUseCase(repository);

      const result = await useCase.execute("animal-1", "em_tratamento");

      expect(result.status).toBe("em_tratamento");
      expect(repository.lastUpdateStatusAnimal?.status.valor).toBe("em_tratamento");
    });

    it("deve exigir os dados da adoção ao mudar para adotado, sem persistir se faltarem", async () => {
      const repository = new FakeAnimalRepository();
      repository.items.push(
        Animal.restore({
          id: "animal-3",
          nome: "Mel",
          especie: "Cachorro",
          raca: "SRD",
          status: AnimalStatus.from("disponivel"),
          urlFoto: null,
          larTemporarioId: null,
          adotanteId: null,
          adotante: null,
          dataAdocao: null,
          createdAt: "2026-09-20T00:00:00.000Z",
        }),
      );
      const useCase = new UpdateAnimalStatusUseCase(repository);

      await expect(useCase.execute("animal-3", "adotado")).rejects.toThrowError(ValidationError);
      expect(repository.lastUpdateStatusAnimal).toBeNull();

      const result = await useCase.execute("animal-3", "adotado", {
        adotante: { nome: "Maria Souza", idade: 40, cep: "39800000", localidade: "Teófilo Otoni" },
        dataAdocao: "2026-09-20",
      });
      expect(result.status).toBe("adotado");
      expect(result.adotante?.nome).toBe("Maria Souza");
      expect(repository.lastUpdateStatusAnimal?.dataAdocao).toBe("2026-09-20");
    });

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
          adotante: Adotante.from({
            nome: "João Silva",
            idade: 30,
            cep: "39800000",
            localidade: "Teófilo Otoni",
          }),
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

    it("deve lançar NotFoundError ao tentar atualizar status de animal inexistente", async () => {
      const repository = new FakeAnimalRepository();
      const useCase = new UpdateAnimalStatusUseCase(repository);

      await expect(useCase.execute("nao-existe", "disponivel")).rejects.toThrowError(NotFoundError);
    });

    it("deve lançar ValidationError ao tentar transição inválida de status", async () => {
      const repository = new FakeAnimalRepository();
      repository.items.push(
        Animal.restore({
          id: "animal-1",
          nome: "Rex",
          especie: "Cachorro",
          raca: "Labrador",
          status: AnimalStatus.from("em_tratamento"),
          urlFoto: null,
          larTemporarioId: null,
          adotanteId: null,
          adotante: null,
          dataAdocao: null,
          createdAt: "2026-09-20T00:00:00.000Z",
        }),
      );
      const useCase = new UpdateAnimalStatusUseCase(repository);

      // Em tratamento não pode transicionar direto para adotado
      await expect(
        useCase.execute("animal-1", "adotado", {
          adotante: { nome: "João Silva", idade: 30, cep: "39800000", localidade: "Teófilo Otoni" },
          dataAdocao: "2026-09-20",
        }),
      ).rejects.toThrowError(ValidationError);
    });

    it("deve lançar ValidationError ao tentar passar dados de adoção para status não adotado", async () => {
      const repository = new FakeAnimalRepository();
      repository.items.push(
        Animal.restore({
          id: "animal-1",
          nome: "Rex",
          especie: "Cachorro",
          raca: "Labrador",
          status: AnimalStatus.from("disponivel"),
          urlFoto: null,
          larTemporarioId: null,
          adotanteId: null,
          adotante: null,
          dataAdocao: null,
          createdAt: "2026-09-20T00:00:00.000Z",
        }),
      );
      const useCase = new UpdateAnimalStatusUseCase(repository);

      await expect(
        useCase.execute("animal-1", "em_tratamento", {
          adotante: { nome: "João Silva", idade: 30, cep: "39800000", localidade: "Teófilo Otoni" },
          dataAdocao: "2026-09-20",
        }),
      ).rejects.toThrowError(ValidationError);
    });
  });

  describe("DeleteAnimalUseCase", () => {
    it("deve remover um animal existente com sucesso", async () => {
      const repository = new FakeAnimalRepository();
      repository.items.push(
        Animal.restore({
          id: "animal-del",
          nome: "Rex",
          especie: "Cachorro",
          raca: null,
          status: AnimalStatus.from("disponivel"),
          urlFoto: null,
          larTemporarioId: null,
          adotanteId: null,
          adotante: null,
          dataAdocao: null,
          createdAt: "2026-09-20T00:00:00.000Z",
        }),
      );

      const useCase = new DeleteAnimalUseCase(repository);
      await useCase.execute("animal-del");

      expect(repository.removeCalled).toBe(true);
      expect(repository.items).toHaveLength(0);
    });

    it("deve lançar NotFoundError ao tentar remover id inexistente", async () => {
      const repository = new FakeAnimalRepository();
      const useCase = new DeleteAnimalUseCase(repository);

      await expect(useCase.execute("nao-existe")).rejects.toThrowError(NotFoundError);
    });
  });
});
