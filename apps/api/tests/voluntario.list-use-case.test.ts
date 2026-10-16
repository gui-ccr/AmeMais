import { describe, expect, it } from "vitest";
import { Voluntario } from "../src/features/voluntarios/domain/voluntario.entity";
import { AreaDeAjuda } from "../src/features/voluntarios/domain/area-de-ajuda.vo";
import { StatusVoluntario } from "../src/features/voluntarios/domain/status-voluntario.vo";
import { TipoVoluntario } from "../src/features/voluntarios/domain/tipo-voluntario.vo";
import {
  ListVoluntariosUseCase,
} from "../src/features/voluntarios/use-cases/list-voluntarios.use-case";
import type {
  IVoluntarioRepository,
  ListVoluntariosFiltros,
  ListVoluntariosResultado,
} from "../src/features/voluntarios/voluntario.repository";
import { ForbiddenError } from "../src/core/errors";

/** A interface ganhou métodos das KAN-83/84 (existsByEmail/create/findById/
 * findLarVinculado/update); este fake só precisa deles para compilar — a
 * listagem não os usa. */
class FakeVoluntarioRepository implements IVoluntarioRepository {
  public acesso = true;
  public listChamado = false;
  public ultimosFiltros: ListVoluntariosFiltros | null = null;
  public resultado: ListVoluntariosResultado = { items: [], total: 0 };

  async temAcessoDeLeitura(): Promise<boolean> {
    return this.acesso;
  }

  async existsByEmail(): Promise<boolean> {
    return false;
  }

  async create(): Promise<never> {
    throw new Error("não usado nos testes de listagem");
  }

  async findById(): Promise<never> {
    throw new Error("não usado nos testes de listagem");
  }

  async findLarVinculado(): Promise<null> {
    return null;
  }

  async update(): Promise<never> {
    throw new Error("não usado nos testes de listagem");
  }

  async list(filtros: ListVoluntariosFiltros): Promise<ListVoluntariosResultado> {
    this.listChamado = true;
    this.ultimosFiltros = filtros;
    return this.resultado;
  }
}

function voluntarioFixture(): Voluntario {
  return Voluntario.restore({
    id: "vol-1",
    nome: "Ana Silva",
    email: "ana@exemplo.com",
    telefone: "33998765432",
    tipo: TipoVoluntario.from("apoio_geral"),
    bairro: "Centro",
    areasDeAjuda: [AreaDeAjuda.from("eventos")],
    status: StatusVoluntario.from("ativo"),
    createdAt: "2026-10-14T00:00:00.000Z",
  });
}

describe("ListVoluntariosUseCase", () => {
  it("nega acesso (ForbiddenError) sem nem chamar repository.list(), quando temAcessoDeLeitura() é false", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.acesso = false;
    const useCase = new ListVoluntariosUseCase(repository);

    await expect(useCase.execute({ page: 1, limit: 20 })).rejects.toThrowError(ForbiddenError);
    expect(repository.listChamado).toBe(false);
  });

  it("lista e converte os voluntários para DTO quando há acesso", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.resultado = { items: [voluntarioFixture()], total: 1 };
    const useCase = new ListVoluntariosUseCase(repository);

    const resultado = await useCase.execute({ page: 1, limit: 20 });

    expect(resultado.total).toBe(1);
    expect(resultado.items).toHaveLength(1);
    expect(resultado.items[0]).toEqual({
      id: "vol-1",
      nome: "Ana Silva",
      email: "ana@exemplo.com",
      telefone: "33998765432",
      tipo: "apoio_geral",
      status: "ativo",
      bairro: "Centro",
      areasDeAjuda: ["eventos"],
      createdAt: "2026-10-14T00:00:00.000Z",
    });
  });

  it("repassa os filtros recebidos para o repository sem alterá-los", async () => {
    const repository = new FakeVoluntarioRepository();
    const useCase = new ListVoluntariosUseCase(repository);
    const filtros: ListVoluntariosFiltros = {
      busca: "Ana",
      tipo: "veterinario",
      status: "ativo",
      area: "transporte",
      page: 2,
      limit: 10,
    };

    await useCase.execute(filtros);

    expect(repository.ultimosFiltros).toEqual(filtros);
  });

  it("devolve lista vazia (sem erro) quando não há voluntários correspondentes", async () => {
    const repository = new FakeVoluntarioRepository();
    repository.resultado = { items: [], total: 0 };
    const useCase = new ListVoluntariosUseCase(repository);

    const resultado = await useCase.execute({ page: 1, limit: 20 });

    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(0);
  });
});
