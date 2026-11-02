import { NextRequest } from "next/server";
import { ok, fail } from "@/core/http";
import { requireUser } from "@/middleware/auth";
import { createSupabaseForUser } from "@/lib/supabase";
import { DashboardRepository } from "./dashboard.repository";
import { GetDashboardUseCase } from "./use-cases/get-dashboard.use-case";

export class DashboardController {
  get = async (request: NextRequest) => {
    try {
      const user = await requireUser(request);
      const db = createSupabaseForUser(user.accessToken);

      const useCase = new GetDashboardUseCase(new DashboardRepository(db));
      return ok(await useCase.execute());
    } catch (error) {
      return fail(error);
    }
  };
}

export const dashboardController = new DashboardController();
