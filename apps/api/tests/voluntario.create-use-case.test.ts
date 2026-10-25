import { describe, expect, it } from "vitest";
import { Voluntario } from "../src/features/voluntarios/domain/voluntario.entity";
import { CreateVoluntarioUseCase } from "../src/features/voluntarios/use-cases/create-voluntario.use-case";
import type { IVoluntarioRepository, ListVoluntariosResultado } from "../src/features/voluntarios/voluntario.repository";
import type { VoluntarioCreationData } from "../src/features/voluntarios/domain/voluntario.entity";
import type { CreateVoluntarioDTO } from "../src/features/voluntarios/schema";
import { ConflictError, ValidationError } from "../src/core/errors";

class FakeVoluntarioRepository implements IVoluntarioRepository {
  public emailsExistentes = new Set<string>();
  public existsByEmailChamadoCom: string[] = [];
  public createChamado = false;
  public ultimoCreateInput: VoluntarioCreationData | null = null;
  private sequencial = 0;

  async temAcessoDeLeitura(): Promise<boolean> {
    return true;
  }

  async list(): Promise<ListVoluntariosResultado> {
    return { items: [], total: 0 };
  }

  async existsByEmail(email: string): Promise<boolean> {
    this.existsByEmailChamadoCom.push(email);
    return this.emailsExistentes.has(email.toLowerCase());
  }

  async create(input: VoluntarioCreationData): Promise<Voluntario> {
    this.createChamado = true;
    this.ultimoCreateInput = input;
    this.sequencial += 1;
    return Voluntario.restore({
      id: `vol-${this.sequencial}`,
      createdAt: "2026-10-14T00:00:00.000Z",
      ...input,
    });
  }

  async findById(): Promise<never> {
    throw new Error("não usado nos testes de cadastro");
  }

  async findLarVinculado(): Promise<null> {
    return null;
  }

  async findLaresVinculados(): Promise<Map<string, never>> {
    return new Map<string, never>();
  }

  async update(): Promise<never> {
    throw new Error("não usado nos testes de cadastro");
  }
}

function inputValido(overrides: Partial<CreateVoluntarioDTO> = {}): CreateVoluntarioDTO {
  return {
    nome: "Ana Silva",
    email: "ana@exemplo.com",
    telefone: "(33) 99876-5432",
    tipo: "apoio_geral",
    bairro: "Centro",
    areasDeAjuda: ["eventos"],
    ...overrides,
  };
}

describe("CreateVoluntarioUseCase", () => {
  it("cadastra com sucesso, devolvendo o VoluntarioDTO com status 'ativo' e telefone normalizado", async () => {
    const repository = new FakeVoluntarioRepository();
    const useCase = new CreateVoluntarioUseCase(repository);

    const dto = await useCase.execute(inputValido());

    expect(dto.id).toBe("vol-1");
    expect(dto.status).toBe("ativo");
    expect(dto.telefone).toBe("33998765432");
    expect(dto.nome).toBe("Ana Silva");
    expect(repository.createChamado).toBe(true);
  });

  it("aceita email: null, sem consultar existsByEmail", async () => {
    const repository = new FakeVoluntarioRepository();
    const useCase = new CreateVoluntarioUseCase(repository);

    const dto = await useCase.execute(inputValido({ email: null }));

    expect(dto.email).toBeNull();
    expect(repository.existsByEmailChamadoCom).toEqual([]);
  });

  it("aceita bairro: null", async () => {
    const repository = new FakeVoluntarioRepository();
    const useCase = new CreateVoluntarioUseCase(repository);

    const dto = await useCase.execute(inputValido({ bairro: null }));

    expect(dto.bairro).toBeNull();
  });

  it("aceita areasDeAjuda: []", async () => {
    const repository = new FakeVoluntarioRepository();
    const useCase = new CreateVoluntarioUseCase(repository);

    const dto = await useCase.execute(inputValido({ areasDeAjuda: [] }));

    expect(dto.areasDeAjuda).toEqual([]);
  });

  it("rejeita dado inválido (ValidationError) sem chamar o repository", async () => {
    const repository = new FakeVoluntarioRepository();
    const useCase = new CreateVoluntarioUseCase(repository);

    await expect(useCase.execute(inputValido({ nome: "A" }))).rejects.toThrowError(ValidationError);
    expect(repository.createChamado).toBe(false);
  });

  it("consulta existsByEmail com o e-mail já validado/normalizado pela entidade", async () => {
    const repository = new FakeVoluntarioRepository();
    const useCase = new CreateVoluntarioUseCase(repository);

    await useCase.execute(inputValido({ email: "ana@exemplo.com" }));

    expect(repository.existsByEmailChamadoCom).toEqual(["ana@exemplo.com"]);
  });

  it("recusa com ConflictError (409) quando já existe voluntário com o mesmo e-mail, sem chamar create()", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.emailsExistentes.add("ana@exemplo.com");
    const useCase = new CreateVoluntarioUseCase(repository);

    await expect(useCase.execute(inputValido({ email: "ana@exemplo.com" }))).rejects.toThrowError(ConflictError);
    expect(repository.createChamado).toBe(false);
  });

  it("trata e-mails que diferem só em maiúsculas/minúsculas como o mesmo e-mail", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.emailsExistentes.add("ana.oliveira@example.com");
    const useCase = new CreateVoluntarioUseCase(repository);

    await expect(
      useCase.execute(inputValido({ email: "Ana.Oliveira@Example.com" })),
    ).rejects.toThrowError(ConflictError);
  });

  it("propaga o ConflictError lançado pelo repository (violação do índice único na corrida), sem reinterpretar o erro", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.create = async () => {
      throw new ConflictError("Já existe um voluntário cadastrado com este e-mail.");
    };
    const useCase = new CreateVoluntarioUseCase(repository);

    await expect(useCase.execute(inputValido())).rejects.toThrowError(ConflictError);
  });

  it("ignora qualquer 'status' enviado pelo cliente — todo cadastro novo nasce ativo", async () => {
    const repository = new FakeVoluntarioRepository();
    const useCase = new CreateVoluntarioUseCase(repository);

    const dto = await useCase.execute({ ...inputValido(), status: "inativo" } as CreateVoluntarioDTO);

    expect(dto.status).toBe("ativo");
  });
});
