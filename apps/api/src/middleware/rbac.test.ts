import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";

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

  it("retorna o usuário + role quando o profile tem um dos roles permitidos", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1", email: "colaboradora@amemais.org" });
    singleMock.mockResolvedValue({ data: { role: "admin" }, error: null });

    const result = await requireRole(fakeRequest(), ["admin"]);

    expect(result).toEqual({ id: "user-1", email: "colaboradora@amemais.org", role: "admin" });
  });

  it("lança ForbiddenError quando o role do profile não está na lista permitida", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1", email: null });
    singleMock.mockResolvedValue({ data: { role: "colaborador" }, error: null });

    await expect(requireRole(fakeRequest(), ["admin"])).rejects.toThrow(ForbiddenError);
  });

  it("lança ForbiddenError quando não existe profile pro usuário autenticado", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1", email: null });
    singleMock.mockResolvedValue({ data: null, error: { message: "not found" } });

    await expect(requireRole(fakeRequest(), ["admin"])).rejects.toThrow(ForbiddenError);
  });

  it("propaga o erro de requireUser quando não há usuário autenticado", async () => {
    requireUserMock.mockRejectedValue(new Error("sem token"));

    await expect(requireRole(fakeRequest(), ["admin"])).rejects.toThrow("sem token");
    expect(singleMock).not.toHaveBeenCalled();
  });
});
