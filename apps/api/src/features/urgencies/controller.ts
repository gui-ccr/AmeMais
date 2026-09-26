import { NextRequest } from "next/server";
import { ok, created, fail } from "@/core/http";
import { requireUser } from "@/middleware/auth";
import { createSupabaseForUser } from "@/lib/supabase";
import {
  createUrgencySchema,
  updateUrgencySchema,
  urgencyIdParamSchema,
  registerDonationSchema,
} from "./schema";
import { UrgencyRepository } from "./urgency.repository";
import { ListUrgenciesUseCase } from "./use-cases/list-urgencies.use-case";
import { GetUrgencyUseCase } from "./use-cases/get-urgency.use-case";
import { CreateUrgencyUseCase } from "./use-cases/create-urgency.use-case";
import { UpdateUrgencyUseCase } from "./use-cases/update-urgency.use-case";
import { DeleteUrgencyUseCase } from "./use-cases/delete-urgency.use-case";
import { RegisterDonationUseCase } from "./use-cases/register-donation.use-case";

/**
 * Controller da feature Urgências: 1 método por endpoint. Cada método:
 * 1. extrai contexto HTTP (auth, params, body);
 * 2. valida a entrada com Zod;
 * 3. instancia o repository (com um client Supabase autenticado como o
 *    próprio usuário — a RLS de `urgency_items` decide o que ele pode
 *    fazer: leitura liberada a qualquer autenticado, escrita para
 *    Admin/Voluntário, delete só Admin) e o use case correspondente;
 * 4. executa o use case com os dados já validados e devolve a resposta.
 *
 * Nunca fala com o Supabase diretamente — quem faz isso é o repository,
 * por dentro do use case. Não há checagem de cargo aqui no Controller:
 * assim como em Events e Animals, quem decide o que cada cargo pode
 * fazer é a política de RLS da tabela (check_user_access), não uma
 * condicional em código. Um INSERT/UPDATE/DELETE barrado pela RLS chega
 * ao repository como erro do Postgres e é traduzido para `ForbiddenError`
 * (403) em `core/supabase-errors.ts` — daqui pra cima, `fail(error)`
 * cuida de transformar isso na resposta HTTP certa.
 *
 * Métodos são arrow functions de instância (não `class methods` comuns)
 * para poderem ser passados como referência (`urgencyController.list`)
 * para o roteamento do Next.js sem perder o `this`.
 */
export class UrgencyController {
  list = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);

      const useCase = new ListUrgenciesUseCase(new UrgencyRepository(db));
      const urgencies = await useCase.execute();

      return ok(urgencies);
    } catch (error) {
      return fail(error);
    }
  };

  getById = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = urgencyIdParamSchema.parse(await params);

      const useCase = new GetUrgencyUseCase(new UrgencyRepository(db));
      const urgency = await useCase.execute(id);

      return ok(urgency);
    } catch (error) {
      return fail(error);
    }
  };

  create = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const body = await request.json();
      const input = createUrgencySchema.parse(body);

      const useCase = new CreateUrgencyUseCase(new UrgencyRepository(db));
      const urgency = await useCase.execute(input);

      return created(urgency);
    } catch (error) {
      return fail(error);
    }
  };

  update = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = urgencyIdParamSchema.parse(await params);
      const body = await request.json();
      const input = updateUrgencySchema.parse(body);

      const useCase = new UpdateUrgencyUseCase(new UrgencyRepository(db));
      const urgency = await useCase.execute(id, input);

      return ok(urgency);
    } catch (error) {
      return fail(error);
    }
  };

  delete = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = urgencyIdParamSchema.parse(await params);

      const useCase = new DeleteUrgencyUseCase(new UrgencyRepository(db));
      await useCase.execute(id);

      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  };

  registerDonation = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);
      const { id } = urgencyIdParamSchema.parse(await params);
      const body = await request.json();
      const { valor } = registerDonationSchema.parse(body);

      const useCase = new RegisterDonationUseCase(new UrgencyRepository(db));
      const urgency = await useCase.execute(id, valor);

      return ok(urgency);
    } catch (error) {
      return fail(error);
    }
  };
}

export const urgencyController = new UrgencyController();