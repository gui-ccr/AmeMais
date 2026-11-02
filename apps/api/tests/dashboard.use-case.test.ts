import { describe, expect, it } from "vitest";
import { ForbiddenError } from "../src/core/errors";
import type { IDashboardRepository, ModuloDoDashboard } from "../src/features/dashboard/dashboard.repository";
import { GetDashboardUseCase } from "../src/features/dashboard/use-cases/get-dashboard.use-case";

class FakeDashboardRepository implements IDashboardRepository {
  public chamadas: string[] = [];
  public agoraRecebido: Date | null = null;

  constructor(private readonly modulosPermitidos: ModuloDoDashboard[]) {}

  async temAcesso(modulo: ModuloDoDashboard) {
    return this.modulosPermitidos.includes(modulo);
  }
  async contarAnimais() {
    this.chamadas.push("animais");
    return { total: 3, porStatus: { disponivel: 1, em_tratamento: 1, em_lar_temporario: 0, adotado: 1 } };
  }
  async contarLares() {
    this.chamadas.push("lares");
    return { disponiveis: 2, vagasLivres: 5 };
  }
  async contarUrgencias() {
    this.chamadas.push("urgencias");
    return { abertas: 4, urgentes: 1 };
  }
  async contarVoluntarios() {
    this.chamadas.push("voluntarios");
    return { ativos: 7, total: 9 };
  }
  async proximosEventos(agora: Date) {
    this.chamadas.push("eventos");
    this.agoraRecebido = agora;
    return { total: 1, proximos: [{ id: "e1", titulo: "Feira de adoção", dataEvento: "2026-11-01T13:00:00+00:00" }] };
  }
}

const TODOS: ModuloDoDashboard[] = ["operacional", "lares", "urgencias", "voluntarios", "campanhas"];

describe("GetDashboardUseCase", () => {
  it("devolve todos os blocos para quem acessa todos os módulos", async () => {
    const resultado = await new GetDashboardUseCase(new FakeDashboardRepository(TODOS)).execute();

    expect(resultado.animais?.total).toBe(3);
    expect(resultado.lares).toEqual({ disponiveis: 2, vagasLivres: 5 });
    expect(resultado.urgencias).toEqual({ abertas: 4, urgentes: 1 });
    expect(resultado.voluntarios).toEqual({ ativos: 7, total: 9 });
    expect(resultado.eventos?.proximos).toHaveLength(1);
  });

  it("deixa null, sem consultar, o bloco de um módulo sem acesso", async () => {
    const repo = new FakeDashboardRepository(["urgencias", "campanhas"]);
    const resultado = await new GetDashboardUseCase(repo).execute();

    expect(resultado.animais).toBeNull();
    expect(resultado.lares).toBeNull();
    expect(resultado.voluntarios).toBeNull();
    expect(resultado.urgencias).not.toBeNull();
    expect(resultado.eventos).not.toBeNull();
    expect([...repo.chamadas].sort()).toEqual(["eventos", "urgencias"]);
  });

  it("lança 403 quando a pessoa não acessa nenhum módulo", async () => {
    await expect(new GetDashboardUseCase(new FakeDashboardRepository([])).execute()).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("usa o relógio injetado para decidir o que é próximo evento", async () => {
    const repo = new FakeDashboardRepository(["campanhas"]);
    const agora = new Date("2026-10-26T12:00:00Z");
    await new GetDashboardUseCase(repo, () => agora).execute();

    expect(repo.agoraRecebido).toBe(agora);
  });
});
