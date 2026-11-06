import { NextRequest } from "next/server";
import { ok, created, fail, lerCorpoJson } from "@/core/http";
import { exigirNivelTotal, MODULOS_RBAC } from "@/core/acesso";
import { requireUser } from "@/middleware/auth";
import { createSupabaseForUser } from "@/lib/supabase";
import { createDoacaoSchema, updateDoacaoSchema, doacaoIdParamSchema } from "./schema";
import { DoacaoRepository } from "./doacao.repository";
import { ListDoacoesUseCase } from "./use-cases/list-doacoes.use-case";
import { GetDoacaoUseCase } from "./use-cases/get-doacao.use-case";
import { CreateDoacaoUseCase } from "./use-cases/create-doacao.use-case";
import { UpdateDoacaoUseCase } from "./use-cases/update-doacao.use-case";
import { DeleteDoacaoUseCase } from "./use-cases/delete-doacao.use-case";

type Params = { params: Promise<{ id: string }> };

/** Leitura: qualquer nível no módulo 'doacoes' (RLS). Escrita: nível 'total'. */
export class DoacaoController {
  list = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);

      return ok(await new ListDoacoesUseCase(new DoacaoRepository(db)).execute());
    } catch (error) {
      return fail(error);
    }
  };

  getById = async (request: NextRequest, { params }: Params) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = doacaoIdParamSchema.parse(await params);

      return ok(await new GetDoacaoUseCase(new DoacaoRepository(db)).execute(id));
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      await exigirNivelTotal(db, MODULOS_RBAC.doacoes);
      const input = createDoacaoSchema.parse(await lerCorpoJson(request));

      return created(await new CreateDoacaoUseCase(new DoacaoRepository(db)).execute(input));
    } catch (error) {
      return fail(error);
    }
  };

  update = async (request: NextRequest, { params }: Params) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      await exigirNivelTotal(db, MODULOS_RBAC.doacoes);
      const { id } = doacaoIdParamSchema.parse(await params);
      const input = updateDoacaoSchema.parse(await lerCorpoJson(request));

      return ok(await new UpdateDoacaoUseCase(new DoacaoRepository(db)).execute(id, input));
    } catch (error) {
      return fail(error);
    }
  };

  delete = async (request: NextRequest, { params }: Params) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      await exigirNivelTotal(db, MODULOS_RBAC.doacoes);
      const { id } = doacaoIdParamSchema.parse(await params);

      await new DeleteDoacaoUseCase(new DoacaoRepository(db)).execute(id);
      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  };
}

export const doacaoController = new DoacaoController();
