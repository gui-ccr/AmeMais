import { describe, expect, it } from "vitest";
import { Voluntario } from "../src/features/voluntarios/domain/voluntario.entity";
import { UpdateVoluntarioStatusUseCase } from "../src/features/voluntarios/use-cases/update-voluntario-status.use-case";
import { DeleteVoluntarioUseCase } from "../src/features/voluntarios/use-cases/delete-voluntario.use-case";
import type { IVoluntarioRepository, ListVoluntariosResultado } from "../src/features/voluntarios/voluntario.repository";
import type { LarVinculadoDTO } from "../src/features/voluntarios/voluntario.dto";
import type { StatusVoluntarioValue } from "../src/features/voluntarios/domain/status-voluntario.vo";
import { ConflictError, NotFoundError } from "../src/core/errors";

class FakeVoluntarioRepository implements IVoluntarioRepository {
  public voluntarios = new Map<string, Voluntario>();
  public lares = new Map<string, LarVinculadoDTO>();

  async temAcessoDeLeitura(): Promise<boolean> {
    return true;
  }

  async list(): Promise<ListVoluntariosResultado> {
    return { items: [], total: 0 };
  }

  async findById(id: string): Promise<Voluntario> {
    const voluntario = this.voluntarios.get(id);
    if (!voluntario) throw new NotFoundError("Voluntário");
    return voluntario;
  }

  async findLarVinculado(voluntarioId: string): Promise<LarVinculadoDTO | null> {
    return this.lares.get(voluntarioId) ?? null;
  }

  async findLaresVinculados(): Promise<Map<string, LarVinculadoDTO>> {
    return new Map(this.lares);
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

  async updateStatus(id: string, status: StatusVoluntarioValue): Promise<Voluntario> {
    const voluntario = await this.findById(id);
    voluntario.alterarStatus(status);
    return voluntario;
  }

  async remove(id: string): Promise<void> {
    this.voluntarios.delete(id);
  }
}

function voluntarioFixture(id: string, status: StatusVoluntarioValue = "ativo"): Voluntario {
  const voluntario = Voluntario.restore({
    id,
    createdAt: "2026-10-14T00:00:00.000Z",
    ...Voluntario.create({ nome: "Ana Silva", email: "ana@exemplo.com", telefone: "33998765432", tipo: "apoio_geral" }),
  });
  voluntario.alterarStatus(status);
  return voluntario;
}

describe("UpdateVoluntarioStatusUseCase", () => {
  it("inativa um voluntário ativo", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1", "ativo"));

    const dto = await new UpdateVoluntarioStatusUseCase(repository).execute("vol-1", { status: "inativo" });

    expect(dto.status).toBe("inativo");
  });

  it("ativa um voluntário inativo", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1", "inativo"));

    const dto = await new UpdateVoluntarioStatusUseCase(repository).execute("vol-1", { status: "ativo" });

    expect(dto.status).toBe("ativo");
  });

  it("inativar não mexe no lar vinculado", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));
    repository.lares.set("vol-1", { id: "lar-1", enderecoRegiao: "Zona Norte" });

    await new UpdateVoluntarioStatusUseCase(repository).execute("vol-1", { status: "inativo" });

    expect(repository.lares.get("vol-1")).toEqual({ id: "lar-1", enderecoRegiao: "Zona Norte" });
  });

  it("id inexistente -> NotFoundError", async () => {
    const repository = new FakeVoluntarioRepository();

    await expect(new UpdateVoluntarioStatusUseCase(repository).execute("x", { status: "inativo" })).rejects.toThrowError(
      NotFoundError,
    );
  });
});

describe("DeleteVoluntarioUseCase", () => {
  it("remove um voluntário sem lar vinculado", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));

    await new DeleteVoluntarioUseCase(repository).execute("vol-1");

    expect(repository.voluntarios.has("vol-1")).toBe(false);
  });

  it("com lar vinculado -> ConflictError sugerindo inativar, e não remove", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));
    repository.lares.set("vol-1", { id: "lar-1", enderecoRegiao: "Zona Norte" });
    const useCase = new DeleteVoluntarioUseCase(repository);

    await expect(useCase.execute("vol-1")).rejects.toThrowError(ConflictError);
    await expect(useCase.execute("vol-1")).rejects.toThrowError(/[Ii]native/);
    expect(repository.voluntarios.has("vol-1")).toBe(true);
  });

  it("id inexistente -> NotFoundError", async () => {
    const repository = new FakeVoluntarioRepository();

    await expect(new DeleteVoluntarioUseCase(repository).execute("x")).rejects.toThrowError(NotFoundError);
  });
});
