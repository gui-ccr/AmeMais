import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyPublicSite } from "@/lib/public-site";

describe("notifyPublicSite (KAN-115)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("faz POST em /api/revalidate com o segredo no cabeçalho e as tags no corpo", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    await notifyPublicSite(["animais", "urgencias"], { url: "https://site.exemplo/", secret: "s3gredo", fetchFn });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://site.exemplo/api/revalidate");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["x-revalidate-secret"]).toBe("s3gredo");
    expect(JSON.parse(init.body as string)).toEqual({ tags: ["animais", "urgencias"] });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("não chama nada sem WEB_PUBLIC_URL ou REVALIDATE_SECRET", async () => {
    const fetchFn = vi.fn();

    await notifyPublicSite(["animais"], { url: "", secret: "s3gredo", fetchFn });
    await notifyPublicSite(["animais"], { url: "https://site.exemplo", secret: "", fetchFn });

    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("erro de rede não vira erro para quem chamou (só log)", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      notifyPublicSite(["animais"], { url: "https://site.exemplo", secret: "s3gredo", fetchFn }),
    ).resolves.toBeUndefined();
    expect(log).toHaveBeenCalled();
  });

  it("resposta de erro do site (ex.: 401) só é registrada no log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    await expect(
      notifyPublicSite(["pontos-coleta"], { url: "https://site.exemplo", secret: "errado", fetchFn }),
    ).resolves.toBeUndefined();
    expect(log.mock.calls[0]?.[0]).toContain("401");
  });
});
