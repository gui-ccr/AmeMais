import { NextRequest } from "next/server";
import { created, fail, lerCorpoJson, ok } from "@/core/http";
import { ForbiddenError } from "@/core/errors";
import { createSupabaseForUser } from "@/lib/supabase";
import { requireUser } from "@/middleware/auth";
import { ContasGateway } from "./contas.gateway";
import { EquipeRepository } from "./equipe.repository";
import {
  createDepartamentoSchema,
  createMembroSchema,
  departamentoIdParamSchema,
  listMembrosQuerySchema,
  membroIdParamSchema,
  salvarMatrizSchema,
  trocarMinhaSenhaSchema,
  updateDepartamentoSchema,
  updateDepartamentosDoMembroSchema,
  updateStatusDoMembroSchema,
} from "./schema";
import {
  CreateDepartamentoUseCase,
  ListDepartamentosUseCase,
  RemoveDepartamentoUseCase,
  SalvarMatrizUseCase,
  UpdateDepartamentoUseCase,
} from "./use-cases/departamentos.use-cases";
import {
  CreateMembroUseCase,
  ListMembrosUseCase,
  RedefinirSenhaDoMembroUseCase,
  TrocarMinhaSenhaUseCase,
  UpdateDepartamentosDoMembroUseCase,
  UpdateStatusDoMembroUseCase,
} from "./use-cases/membros.use-cases";

type Params = { params: Promise<{ id: string }> };

/**
 * Porta de entrada de TODAS as rotas de equipe: autentica e confere `check_user_access('admin','total')`
 * com o token do próprio usuário. Só depois disso alguma rota pode tocar na service role.
 */
async function autenticarAdmin(request: NextRequest): Promise<EquipeRepository> {
  const user = await requireUser(request);
  const repository = new EquipeRepository(createSupabaseForUser(user.accessToken));
  if (!(await repository.temAcessoAdminTotal())) throw new ForbiddenError();
  return repository;
}

export class EquipeController {
  listMembros = async (request: NextRequest) => {
    try {
      const repository = await autenticarAdmin(request);
      const { busca } = listMembrosQuerySchema.parse({ busca: request.nextUrl.searchParams.get("busca") ?? undefined });
      return ok(await new ListMembrosUseCase(repository).execute(busca));
    } catch (error) {
      return fail(error);
    }
  };

  createMembro = async (request: NextRequest) => {
    try {
      const repository = await autenticarAdmin(request);
      const input = createMembroSchema.parse(await lerCorpoJson(request));
      return created(await new CreateMembroUseCase(repository, new ContasGateway()).execute(input));
    } catch (error) {
      return fail(error);
    }
  };

  updateDepartamentosDoMembro = async (request: NextRequest, { params }: Params) => {
    try {
      const repository = await autenticarAdmin(request);
      const { id } = membroIdParamSchema.parse(await params);
      const { departamentoIds } = updateDepartamentosDoMembroSchema.parse(await lerCorpoJson(request));
      await new UpdateDepartamentosDoMembroUseCase(repository).execute(id, departamentoIds);
      return ok({ updated: true });
    } catch (error) {
      return fail(error);
    }
  };

  updateStatusDoMembro = async (request: NextRequest, { params }: Params) => {
    try {
      const repository = await autenticarAdmin(request);
      const { id } = membroIdParamSchema.parse(await params);
      const { ativo } = updateStatusDoMembroSchema.parse(await lerCorpoJson(request));
      await new UpdateStatusDoMembroUseCase(repository, new ContasGateway()).execute(id, ativo);
      return ok({ id, ativo });
    } catch (error) {
      return fail(error);
    }
  };

  redefinirSenhaDoMembro = async (request: NextRequest, { params }: Params) => {
    try {
      const repository = await autenticarAdmin(request);
      const { id } = membroIdParamSchema.parse(await params);
      return ok(await new RedefinirSenhaDoMembroUseCase(repository, new ContasGateway()).execute(id));
    } catch (error) {
      return fail(error);
    }
  };

  listDepartamentos = async (request: NextRequest) => {
    try {
      const repository = await autenticarAdmin(request);
      return ok(await new ListDepartamentosUseCase(repository).execute());
    } catch (error) {
      return fail(error);
    }
  };

  createDepartamento = async (request: NextRequest) => {
    try {
      const repository = await autenticarAdmin(request);
      const input = createDepartamentoSchema.parse(await lerCorpoJson(request));
      return created(await new CreateDepartamentoUseCase(repository).execute(input));
    } catch (error) {
      return fail(error);
    }
  };

  updateDepartamento = async (request: NextRequest, { params }: Params) => {
    try {
      const repository = await autenticarAdmin(request);
      const { id } = departamentoIdParamSchema.parse(await params);
      const input = updateDepartamentoSchema.parse(await lerCorpoJson(request));
      return ok(await new UpdateDepartamentoUseCase(repository).execute(id, input));
    } catch (error) {
      return fail(error);
    }
  };

  salvarMatriz = async (request: NextRequest, { params }: Params) => {
    try {
      const repository = await autenticarAdmin(request);
      const { id } = departamentoIdParamSchema.parse(await params);
      const input = salvarMatrizSchema.parse(await lerCorpoJson(request));
      return ok(await new SalvarMatrizUseCase(repository).execute(id, input));
    } catch (error) {
      return fail(error);
    }
  };

  removeDepartamento = async (request: NextRequest, { params }: Params) => {
    try {
      const repository = await autenticarAdmin(request);
      const { id } = departamentoIdParamSchema.parse(await params);
      await new RemoveDepartamentoUseCase(repository).execute(id);
      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  };

  /** Qualquer usuário logado troca a PRÓPRIA senha (não exige admin) e a flag `trocar_senha` é limpa junto. */
  trocarMinhaSenha = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const { senha } = trocarMinhaSenhaSchema.parse(await lerCorpoJson(request));
      await new TrocarMinhaSenhaUseCase(new ContasGateway()).execute(user.id, senha);
      return ok({ updated: true });
    } catch (error) {
      return fail(error);
    }
  };
}

export const equipeController = new EquipeController();
