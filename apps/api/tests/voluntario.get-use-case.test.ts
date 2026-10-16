import { describe, expect, it } from "vitest";
import { Voluntario } from "../src/features/voluntarios/domain/voluntario.entity";
import { GetVoluntarioUseCase } from "../src/features/voluntarios/use-cases/get-voluntario.use-case";
import type { IVoluntarioRepository, ListVoluntariosResultado } from "../src/features/voluntarios/voluntario.repository";
import type { LarVinculadoDTO } from "../src/features/voluntarios/voluntario.dto";
import { NotFoundError } from "../src/core/errors";

class FakeVoluntarioRepository implements IVoluntarioRepository {
  public voluntario: Voluntario | null = null;
  public lar: LarVinculadoDTO | null = null;
  public findLarVinculadoChamadoCom: string[] = [];

  async temAcessoDeLeitura(): Promise<boolean> {
    return true;
  }

  async list(): Promise<ListVoluntariosResultado> {
    return { items: [], total: 0 };
  }

  async findById(): Promise<Voluntario> {
    if (!this.voluntario) throw new NotFoundError("Voluntário");
    return this.voluntario;
  }

  async findLarVinculado(voluntarioId: string): Promise<LarVinculadoDTO | null> {
    this.findLarVinculadoChamadoCom.push(voluntarioId);
    return this.lar;
  }

  async existsByEmail(): Promise<boolean> {
    return false;
  }

  async create(): Promise<never> {
    throw new Error("não usado");
  }

  async update(): Promise<never> {
    throw new Error("não usado");
  }
}

function voluntarioFixture(): Voluntario {
  return Voluntario.restore({
    id: "vol-1",
    createdAt: "2026-10-14T00:00:00.000Z",
    ...Voluntario.create({
      nome: "Ana Silva",
      email: "ana@exemplo.com",
      telefone: "33998765432",
      tipo: "apoio_geral",
      bairro: "Centro",
      areasDeAjuda: ["eventos"],
    }),
  });
}

describe("GetVoluntarioUseCase", () => {
  it("devolve o voluntário com larTemporario: null quando não há vínculo", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntario = voluntarioFixture();
    repository.lar = null;
    const useCase = new GetVoluntarioUseCase(repository);

    const resultado = await useCase.execute("vol-1");

    expect(resultado.id).toBe("vol-1");
    expect(resultado.nome).toBe("Ana Silva");
    expect(resultado.larTemporario).toBeNull();
  });

  it("inclui id e enderecoRegiao do lar quando há vínculo", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntario = voluntarioFixture();
    repository.lar = { id: "lar-1", enderecoRegiao: "Zona Norte" };
    const useCase = new GetVoluntarioUseCase(repository);

    const resultado = await useCase.execute("vol-1");

    expect(resultado.larTemporario).toEqual({ id: "lar-1", enderecoRegiao: "Zona Norte" });
  });

  it("busca o lar vinculado com o mesmo id do voluntário", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntario = voluntarioFixture();
    const useCase = new GetVoluntarioUseCase(repository);

    await useCase.execute("vol-1");

    expect(repository.findLarVinculadoChamadoCom).toEqual(["vol-1"]);
  });

  it("propaga NotFoundError (404) quando o voluntário não existe, sem buscar o lar", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntario = null;
    const useCase = new GetVoluntarioUseCase(repository);

    await expect(useCase.execute("inexistente")).rejects.toThrowError(NotFoundError);
    expect(repository.findLarVinculadoChamadoCom).toEqual([]);
  });
});
