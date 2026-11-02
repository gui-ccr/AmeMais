import { ForbiddenError } from "@/core/errors";
import type { DashboardDTO } from "../dashboard.dto";
import type { IDashboardRepository, ModuloDoDashboard } from "../dashboard.repository";

const MODULOS: ModuloDoDashboard[] = ["operacional", "lares", "urgencias", "voluntarios", "campanhas"];

/**
 * Monta a home do painel: cada bloco só é calculado se a pessoa tem acesso ao módulo
 * dele (senão fica `null`). Sem acesso a nenhum módulo, a home não tem nada para mostrar: 403.
 */
export class GetDashboardUseCase {
  constructor(
    private readonly repository: IDashboardRepository,
    private readonly agora: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<DashboardDTO> {
    const acessos = await Promise.all(MODULOS.map((modulo) => this.repository.temAcesso(modulo)));
    const pode = (modulo: ModuloDoDashboard) => acessos[MODULOS.indexOf(modulo)];

    if (!acessos.some(Boolean)) throw new ForbiddenError("Você não tem acesso a nenhum módulo do painel");

    const [animais, lares, urgencias, voluntarios, eventos] = await Promise.all([
      pode("operacional") ? this.repository.contarAnimais() : null,
      pode("lares") ? this.repository.contarLares() : null,
      pode("urgencias") ? this.repository.contarUrgencias() : null,
      pode("voluntarios") ? this.repository.contarVoluntarios() : null,
      pode("campanhas") ? this.repository.proximosEventos(this.agora()) : null,
    ]);

    return { animais, lares, urgencias, voluntarios, eventos };
  }
}
