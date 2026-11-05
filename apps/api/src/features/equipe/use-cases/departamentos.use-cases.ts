import type { DepartamentoDTO, DepartamentosEModulosDTO } from "../equipe.dto";
import type { IEquipeRepository } from "../equipe.repository";
import type { CreateDepartamentoDTO, SalvarMatrizDTO, UpdateDepartamentoDTO } from "../schema";
import { InternalError } from "@/core/errors";

export class ListDepartamentosUseCase {
  constructor(private readonly repository: IEquipeRepository) {}

  execute(): Promise<DepartamentosEModulosDTO> {
    return this.repository.listarDepartamentos();
  }
}

async function buscarDepartamento(repository: IEquipeRepository, id: string): Promise<DepartamentoDTO> {
  const { departamentos } = await repository.listarDepartamentos();
  const departamento = departamentos.find((item) => item.id === id);
  if (!departamento) throw new InternalError(new Error("Departamento alterado não apareceu na listagem"));
  return departamento;
}

export class CreateDepartamentoUseCase {
  constructor(private readonly repository: IEquipeRepository) {}

  async execute({ nome, descricao }: CreateDepartamentoDTO): Promise<DepartamentoDTO> {
    const id = await this.repository.criarDepartamento(nome, descricao);
    return buscarDepartamento(this.repository, id);
  }
}

export class UpdateDepartamentoUseCase {
  constructor(private readonly repository: IEquipeRepository) {}

  async execute(id: string, { nome, descricao }: UpdateDepartamentoDTO): Promise<DepartamentoDTO> {
    await this.repository.atualizarDepartamento(id, nome, descricao);
    return buscarDepartamento(this.repository, id);
  }
}

/** Substitui a matriz módulo × nível do departamento (atômico, com anti-trava, no banco). */
export class SalvarMatrizUseCase {
  constructor(private readonly repository: IEquipeRepository) {}

  async execute(departamentoId: string, { permissoes }: SalvarMatrizDTO): Promise<DepartamentoDTO> {
    await this.repository.salvarMatriz(departamentoId, permissoes);
    return buscarDepartamento(this.repository, departamentoId);
  }
}

/** Só apaga departamento sem membros (409 caso contrário — regra no banco). */
export class RemoveDepartamentoUseCase {
  constructor(private readonly repository: IEquipeRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.removerDepartamento(id);
  }
}
