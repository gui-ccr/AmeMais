import { NextRequest } from "next/server";
import { ok, created, fail, lerCorpoJson } from "@/core/http";
import { requireUser } from "@/middleware/auth";
import { avisarSiteDepois } from "@/lib/public-site";
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
      const body = await lerCorpoJson(request);
      const input = createUrgencySchema.parse(body);

      const useCase = new CreateUrgencyUseCase(new UrgencyRepository(db));
      const urgency = await useCase.execute(input);

      avisarSiteDepois("urgencias");
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
      const body = await lerCorpoJson(request);
      const input = updateUrgencySchema.parse(body);

      const useCase = new UpdateUrgencyUseCase(new UrgencyRepository(db));
      const urgency = await useCase.execute(id, input);

      avisarSiteDepois("urgencias");
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

      avisarSiteDepois("urgencias");
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
      const body = await lerCorpoJson(request);
      const { valor } = registerDonationSchema.parse(body);

      const useCase = new RegisterDonationUseCase(new UrgencyRepository(db));
      const urgency = await useCase.execute(id, valor);

      avisarSiteDepois("urgencias");
      return ok(urgency);
    } catch (error) {
      return fail(error);
    }
  };
}

export const urgencyController = new UrgencyController();