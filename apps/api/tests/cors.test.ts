import { describe, expect, it } from "vitest";
import { corsHeaders } from "@/middleware/cors";
import { paginated } from "@/core/http";

describe("CORS", () => {
  it("expõe os headers de paginação ao browser", () => {
    const headers = corsHeaders() as Record<string, string>;
    expect(headers["Access-Control-Expose-Headers"]).toBe("X-Total-Count, X-Limit, X-Page, X-Offset");
  });

  it("paginated() devolve os headers de paginação junto do Expose-Headers", () => {
    const response = paginated([{ id: 1 }], { limit: 20, offset: 40, total: 61 });

    expect(response.headers.get("X-Total-Count")).toBe("61");
    expect(response.headers.get("X-Limit")).toBe("20");
    expect(response.headers.get("X-Offset")).toBe("40");
    expect(response.headers.get("Access-Control-Expose-Headers")).toContain("X-Total-Count");
  });
});
