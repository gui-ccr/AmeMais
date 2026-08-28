import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";
import { fail } from "@/core/http";

const requireUserMock = vi.fn();
vi.mock("./auth", () => ({
  requireUser: (...args: unknown[]) => requireUserMock(...args),
}));

const singleMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: singleMock,
        }),
      }),
    }),
  },
}));

const { requireRole } = await import("./rbac");

function fakeRequest() {
  return new NextRequest("http://localhost/api/animals");
}

describe("requireRole", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
    singleMock.mockReset();
  });

  it("retorna o usuário + cargo quando o usuário tem um dos cargos permitidos", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1", email: "voluntaria@amemais.org" });
    singleMock.mockResolvedValue({ data: { cargo: "Admin" }, error: null });

    const result = await requireRole(fakeRequest(), ["Admin"]);

    expect(result).toEqual({ id: "user-1", email: "voluntaria@amemais.org", cargo: "Admin" });
  });

  it("lança ForbiddenError quando o cargo do usuário não está na lista permitida", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1", email: null });
    singleMock.mockResolvedValue({ data: { cargo: "Voluntário" }, error: null });

    await expect(requireRole(fakeRequest(), ["Admin"])).rejects.toThrow(ForbiddenError);
  });

  it("lança ForbiddenError quando não existe usuário em public.usuarios pro autenticado", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1", email: null });
    singleMock.mockResolvedValue({ data: null, error: { message: "not found" } });

    await expect(requireRole(fakeRequest(), ["Admin"])).rejects.toThrow(ForbiddenError);
  });

  it("propaga o erro de requireUser quando não há usuário autenticado", async () => {
    requireUserMock.mockRejectedValue(new Error("sem token"));

    await expect(requireRole(fakeRequest(), ["Admin"])).rejects.toThrow("sem token");
    expect(singleMock).not.toHaveBeenCalled();
  });

  it("[prático] um usuário com cargo Voluntário recebe 403 numa rota que exige Admin", async () => {
    // Simula um controller real: `catch (error) { return fail(error); }`.
    requireUserMock.mockResolvedValue({ id: "user-2", email: "voluntario@amemais.org" });
    singleMock.mockResolvedValue({ data: { cargo: "Voluntário" }, error: null });

    async function deleteUsuarioController(request: NextRequest) {
      try {
        await requireRole(request, ["Admin"]);
        return new Response(null, { status: 204 });
      } catch (error) {
        return fail(error);
      }
    }

    const response = await deleteUsuarioController(fakeRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Você não tem permissão para esta ação" });
  });
});
