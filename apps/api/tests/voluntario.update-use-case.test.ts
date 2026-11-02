import { describe, expect, it } from "vitest";
import { Voluntario } from "../src/features/voluntarios/domain/voluntario.entity";
import { UpdateVoluntarioUseCase } from "../src/features/voluntarios/use-cases/update-voluntario.use-case";
import type { IVoluntarioRepository, ListVoluntariosResultado } from "../src/features/voluntarios/voluntario.repository";
import type { LarVinculadoDTO } from "../src/features/voluntarios/voluntario.dto";
import type { UpdateVoluntarioDTO } from "../src/features/voluntarios/schema";
import { ConflictError, NotFoundError, ValidationError } from "../src/core/errors";

class FakeVoluntarioRepository implements IVoluntarioRepository {
  async updateStatus(): Promise<never> {
    throw new Error("não usado");
  }

  async remove(): Promise<void> {
    throw new Error("não usado");
  }

  public voluntarios = new Map<string, Voluntario>();
  public emailsDeOutros = new Set<string>();
  public existsByEmailChamadoCom: { email: string; excludingId?: string }[] = [];
  public updateChamadoCom: { id: string; voluntario: Voluntario } | null = null;

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

  async findLarVinculado(): Promise<LarVinculadoDTO | null> {
    return null;
  }

  async findLaresVinculados(): Promise<Map<string, LarVinculadoDTO>> {
    return new Map();
  }

  async existsByEmail(email: string, excludingId?: string): Promise<boolean> {
    this.existsByEmailChamadoCom.push({ email, excludingId });
    return this.emailsDeOutros.has(email.toLowerCase());
  }

  async create(): Promise<never> {
    throw new Error("não usado");
  }

  async update(id: string, voluntario: Voluntario): Promise<Voluntario> {
    this.updateChamadoCom = { id, voluntario };
    this.voluntarios.set(id, voluntario);
    return voluntario;
  }
}

function voluntarioFixture(id: string, overrides: Partial<Parameters<typeof Voluntario.create>[0]> = {}): Voluntario {
  return Voluntario.restore({
    id,
    createdAt: "2026-10-14T00:00:00.000Z",
    ...Voluntario.create({
      nome: "Ana Silva",
      email: "ana@exemplo.com",
      telefone: "33998765432",
      tipo: "apoio_geral",
      bairro: "Centro",
      areasDeAjuda: ["eventos"],
      ...overrides,
    }),
  });
}

function corpoValido(overrides: Partial<UpdateVoluntarioDTO> = {}): UpdateVoluntarioDTO {
  return {
    nome: "Ana Silva Atualizada",
    email: "ana@exemplo.com",
    telefone: "(33) 99999-0000",
    tipo: "apoio_geral",
    bairro: "Novo Bairro",
    areasDeAjuda: ["transporte"],
    ...overrides,
  };
}

describe("UpdateVoluntarioUseCase", () => {
  it("atualiza com sucesso e devolve o VoluntarioDTO atualizado", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));
    const useCase = new UpdateVoluntarioUseCase(repository);

    const dto = await useCase.execute("vol-1", corpoValido());

    expect(dto.nome).toBe("Ana Silva Atualizada");
    expect(dto.telefone).toBe("33999990000");
    expect(dto.bairro).toBe("Novo Bairro");
    expect(dto.areasDeAjuda).toEqual(["transporte"]);
  });

  it("lança NotFoundError (404) quando o id não existe, sem chamar update()", async () => {
    const repository = new FakeVoluntarioRepository();
    const useCase = new UpdateVoluntarioUseCase(repository);

    await expect(useCase.execute("inexistente", corpoValido())).rejects.toThrowError(NotFoundError);
    expect(repository.updateChamadoCom).toBeNull();
  });

  it("Caso A: permite manter o próprio e-mail, sem 409", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1", { email: "ana@exemplo.com" }));
    const useCase = new UpdateVoluntarioUseCase(repository);

    const dto = await useCase.execute("vol-1", corpoValido({ email: "ana@exemplo.com" }));

    expect(dto.email).toBe("ana@exemplo.com");
    expect(repository.existsByEmailChamadoCom).toEqual([{ email: "ana@exemplo.com", excludingId: "vol-1" }]);
  });

  it("Caso B: permite trocar para um e-mail livre", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));
    const useCase = new UpdateVoluntarioUseCase(repository);

    const dto = await useCase.execute("vol-1", corpoValido({ email: "novo@exemplo.com" }));

    expect(dto.email).toBe("novo@exemplo.com");
  });

  it("Caso C: recusa com ConflictError (409) quando o e-mail pertence a outro voluntário, sem persistir nada", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));
    repository.emailsDeOutros.add("ocupado@exemplo.com");
    const useCase = new UpdateVoluntarioUseCase(repository);

    await expect(useCase.execute("vol-1", corpoValido({ email: "ocupado@exemplo.com" }))).rejects.toThrowError(
      ConflictError,
    );
    // A garantia real contra atualização parcial é esta: repository.update() (a
    // escrita de verdade no banco) nunca é chamado quando há conflito — a
    // entidade em memória É mutada por voluntario.update() antes da checagem
    // (igual ao Urgency.update() já existente no projeto), mas isso nunca
    // chega a ser persistido.
    expect(repository.updateChamadoCom).toBeNull();
  });

  it("Caso D: compara e-mails sem diferenciar maiúsculas/minúsculas (delegado ao repository, igual ao cadastro)", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));
    const useCase = new UpdateVoluntarioUseCase(repository);

    await useCase.execute("vol-1", corpoValido({ email: "Ana.Oliveira@Example.com" }));

    expect(repository.existsByEmailChamadoCom).toEqual([
      { email: "Ana.Oliveira@Example.com", excludingId: "vol-1" },
    ]);
  });

  it("Caso E: email: null é permitido, sem consultar existsByEmail", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));
    const useCase = new UpdateVoluntarioUseCase(repository);

    const dto = await useCase.execute("vol-1", corpoValido({ email: null }));

    expect(dto.email).toBeNull();
    expect(repository.existsByEmailChamadoCom).toEqual([]);
  });

  it("rejeita dado inválido (ValidationError) sem chamar update() nem existsByEmail", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));
    const useCase = new UpdateVoluntarioUseCase(repository);

    await expect(useCase.execute("vol-1", corpoValido({ nome: "A" }))).rejects.toThrowError(ValidationError);
    expect(repository.updateChamadoCom).toBeNull();
    expect(repository.existsByEmailChamadoCom).toEqual([]);
  });

  it("não atualiza outro voluntário além do id informado", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));
    repository.voluntarios.set("vol-2", voluntarioFixture("vol-2", { nome: "João Souza", email: "joao@exemplo.com" }));
    const useCase = new UpdateVoluntarioUseCase(repository);

    await useCase.execute("vol-1", corpoValido());

    expect(repository.updateChamadoCom?.id).toBe("vol-1");
    expect(repository.voluntarios.get("vol-2")!.nome).toBe("João Souza");
  });

  it("propaga o ConflictError do repository (violação do índice único na corrida)", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.voluntarios.set("vol-1", voluntarioFixture("vol-1"));
    repository.update = async () => {
      throw new ConflictError("Já existe um voluntário cadastrado com este e-mail.");
    };
    const useCase = new UpdateVoluntarioUseCase(repository);

    await expect(useCase.execute("vol-1", corpoValido())).rejects.toThrowError(ConflictError);
  });
});
