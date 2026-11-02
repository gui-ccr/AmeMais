import { describe, expect, it } from "vitest";
import { Shelter } from "../src/features/lares/domain/shelter.entity";
import { ShelterStatus } from "../src/features/lares/domain/shelter-status.vo";
import { ListSheltersUseCase } from "../src/features/lares/use-cases/list-shelters.use-case";
import type {
  IShelterRepository,
  ListSheltersFiltros,
  ListSheltersResultado,
} from "../src/features/lares/shelter.repository";

class FakeShelterRepository implements IShelterRepository {
  public resultado: ListSheltersResultado = { items: [], total: 0 };
  public ultimosFiltros: ListSheltersFiltros | null = null;

  async list(filtros: ListSheltersFiltros): Promise<ListSheltersResultado> {
    this.ultimosFiltros = filtros;
    return this.resultado;
  }

  async findById(): Promise<never> {
    throw new Error("não usado");
  }

  async create(): Promise<never> {
    throw new Error("não usado");
  }

  async updateStatus(): Promise<never> {
    throw new Error("não usado");
  }

  async update(): Promise<never> {
    throw new Error("não usado");
  }

  async inativar(): Promise<void> {}

  async listAnimais(): Promise<never[]> {
    return [];
  }

  async findVoluntarioResumo(): Promise<null> {
    return null;
  }

  async contarAnimais(): Promise<number> {
    return 0;
  }

  async findAnimal(): Promise<never> {
    throw new Error("não usado");
  }

  async vincularAnimal(): Promise<void> {}

  async desvincularAnimal(): Promise<void> {}
}

function shelterFixture(id: string): Shelter {
  return Shelter.restore({
    id,
    nomeResponsavel: "Maria Silva",
    contato: "33999990000",
    capacidade: 5,
    status: ShelterStatus.from("disponivel"),
    enderecoRegiao: "Centro",
    aceitaGatos: true,
    aceitaCachorros: false,
    observacoes: null,
    voluntarioId: null,
    isActive: true,
    createdAt: "2026-10-14T00:00:00.000Z",
  });
}

describe("ListSheltersUseCase", () => {
  it("converte os lares em ShelterListItemDTO, incluindo ocupacao e vagas", async () => {
    const repository = new FakeShelterRepository();
    repository.resultado = {
      items: [{ shelter: shelterFixture("lar-1"), ocupacao: 2, vagas: 3 }],
      total: 1,
    };
    const useCase = new ListSheltersUseCase(repository);

    const resultado = await useCase.execute({ limit: 20, offset: 0 });

    expect(resultado.total).toBe(1);
    expect(resultado.items).toEqual([
      {
        id: "lar-1",
        nomeResponsavel: "Maria Silva",
        contato: "33999990000",
        capacidade: 5,
        status: "disponivel",
        enderecoRegiao: "Centro",
        aceitaGatos: true,
        aceitaCachorros: false,
        observacoes: null,
        voluntarioId: null,
        isActive: true,
        createdAt: "2026-10-14T00:00:00.000Z",
        ocupacao: 2,
        vagas: 3,
      },
    ]);
  });

  it("repassa os filtros recebidos para o repository sem alterá-los", async () => {
    const repository = new FakeShelterRepository();
    const useCase = new ListSheltersUseCase(repository);
    const filtros: ListSheltersFiltros = {
      status: "ocupado",
      busca: "Centro",
      comVagas: true,
      limit: 10,
      offset: 20,
    };

    await useCase.execute(filtros);

    expect(repository.ultimosFiltros).toEqual(filtros);
  });

  it("devolve lista vazia (sem erro) quando não há lares correspondentes", async () => {
    const repository = new FakeShelterRepository();
    repository.resultado = { items: [], total: 0 };
    const useCase = new ListSheltersUseCase(repository);

    const resultado = await useCase.execute({ limit: 20, offset: 0 });

    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(0);
  });
});
