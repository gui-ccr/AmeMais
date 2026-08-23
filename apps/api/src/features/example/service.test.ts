import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Molde de teste de service: nunca chama o Supabase de verdade, só mocka
 * o repository e testa a regra de negócio isolada. Copie este arquivo pra
 * cada feature nova (troque "./repository" e os métodos mockados).
 */
const listMock = vi.fn();
const createMock = vi.fn();

vi.mock("./repository", () => ({
  exampleRepository: {
    list: (...args: unknown[]) => listMock(...args),
    create: (...args: unknown[]) => createMock(...args),
  },
}));

const { exampleService } = await import("./service");

describe("exampleService", () => {
  beforeEach(() => {
    listMock.mockReset();
    createMock.mockReset();
  });

  it("listExamples delega pro repository e devolve o resultado", async () => {
    listMock.mockResolvedValue([{ id: "1", name: "Exemplo", createdAt: "2026-01-01" }]);

    const result = await exampleService.listExamples();

    expect(listMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "1", name: "Exemplo", createdAt: "2026-01-01" }]);
  });

  it("createExample repassa o input recebido pro repository", async () => {
    createMock.mockResolvedValue({ id: "2", name: "Novo", createdAt: "2026-01-02" });

    await exampleService.createExample({ name: "Novo" });

    expect(createMock).toHaveBeenCalledWith({ name: "Novo" });
  });
});
