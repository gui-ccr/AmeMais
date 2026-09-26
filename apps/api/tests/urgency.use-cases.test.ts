import { beforeEach, describe, expect, it } from "vitest";
import { Urgency, type UrgencyCreationData } from "../src/features/urgencies/domain/urgency.entity";
import type { IUrgencyRepository } from "../src/features/urgencies/urgency.repository";
import type { CreateUrgencyDTO, UpdateUrgencyDTO } from "../src/features/urgencies/schema";
import { RegisterDonationUseCase } from "../src/features/urgencies/use-cases/register-donation.use-case";
import { CreateUrgencyUseCase } from "../src/features/urgencies/use-cases/create-urgency.use-case";
import { GetUrgencyUseCase } from "../src/features/urgencies/use-cases/get-urgency.use-case";
import { ListUrgenciesUseCase } from "../src/features/urgencies/use-cases/list-urgencies.use-case";
import { UpdateUrgencyUseCase } from "../src/features/urgencies/use-cases/update-urgency.use-case";
import { DeleteUrgencyUseCase } from "../src/features/urgencies/use-cases/delete-urgency.use-case";
import {
  mapCreateDTOToRow,
  mapRowToEntity,
  mapUpdateDTOToRow,
  type UrgencyRow,
} from "../src/features/urgencies/mapper";
import { NotFoundError, ValidationError } from "../src/core/errors";

class FakeUrgencyRepository implements IUrgencyRepository {
  public items: Urgency[] = [];
  public updateValorArrecadadoCalled = false;
  public updateCalled = false;
  public removeCalled = false;

  async list(): Promise<Urgency[]> {
    return [...this.items];
  }

  async findById(id: string): Promise<Urgency> {
    const item = this.items.find((u) => u.id === id);
    if (!item) throw new NotFoundError("Urgência");
    return item;
  }

  async create(input: UrgencyCreationData): Promise<Urgency> {
    const urgency = Urgency.restore({
      id: "fake-uuid-1",
      ...input,
      createdAt: "2026-09-16T12:00:00.000Z",
    });
    this.items.push(urgency);
    return urgency;
  }

  // Simula a escrita no banco: grava exatamente os campos do patch, igual
  // ao repository real (mapUpdateDTOToRow), sem rechamar a validação de
  // domínio — essa responsabilidade já é do use case/entidade, não do
  // repository. Chamar `urgency.update(input)` de novo aqui mascararia bug
  // de "persistiu o valor errado", porque sempre re-normalizaria em cima do
  // mesmo objeto em memória.
  async update(id: string, input: UpdateUrgencyDTO): Promise<Urgency> {
    this.updateCalled = true;
    const current = await this.findById(id);
    const updated = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
      id: current.id,
      titulo: input.titulo !== undefined ? input.titulo : current.titulo,
      descricao: input.descricao !== undefined ? input.descricao : current.descricao,
      metaArrecadacao:
        input.metaArrecadacao !== undefined ? input.metaArrecadacao : current.metaArrecadacao,
      valorArrecadado:
        input.valorArrecadado !== undefined ? input.valorArrecadado : current.valorArrecadado,
      isActive: input.isActive !== undefined ? input.isActive : current.isActive,
      createdAt: current.createdAt,
    });
    const index = this.items.findIndex((u) => u.id === id);
    this.items[index] = updated;
    return updated;
  }

  async updateValorArrecadado(id: string, valorArrecadado: number): Promise<Urgency> {
    this.updateValorArrecadadoCalled = true;
    const urgency = await this.findById(id);
    const updated = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
      id: urgency.id,
      titulo: urgency.titulo,
      descricao: urgency.descricao,
      metaArrecadacao: urgency.metaArrecadacao,
      valorArrecadado,
      isActive: urgency.isActive,
      createdAt: urgency.createdAt,
    });
    const index = this.items.findIndex((u) => u.id === id);
    this.items[index] = updated;
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.removeCalled = true;
    const index = this.items.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundError("Urgência");
    this.items.splice(index, 1);
  }
}

describe("Use Cases: Urgência", () => {
  let repository: FakeUrgencyRepository;

  beforeEach(() => {
    repository = new FakeUrgencyRepository();
  });

  describe("RegisterDonationUseCase", () => {
    it("Caso 1 — doação válida: incrementa o valor arrecadado (Meta = 1000, Arrecadado = 500, Doação = 200 -> Total 700)", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-1",
        titulo: "Cirurgia urgente",
        descricao: null,
        metaArrecadacao: 1000,
        valorArrecadado: 500,
        isActive: true,
        createdAt: "2026-09-16T10:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new RegisterDonationUseCase(repository);
      const result = await useCase.execute("urg-1", 200);

      expect(result.valorArrecadado).toBe(700);
      expect(result.metaArrecadacao).toBe(1000);
      expect(repository.updateValorArrecadadoCalled).toBe(true);
    });

    it("Caso 2 — doação completa exatamente a meta: permitido (Meta = 1000, Arrecadado = 800, Doação = 200 -> Total 1000)", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-2",
        titulo: "Medicamentos",
        descricao: null,
        metaArrecadacao: 1000,
        valorArrecadado: 800,
        isActive: true,
        createdAt: "2026-09-16T10:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new RegisterDonationUseCase(repository);
      const result = await useCase.execute("urg-2", 200);

      expect(result.valorArrecadado).toBe(1000);
      expect(result.metaArrecadacao).toBe(1000);
      expect(repository.updateValorArrecadadoCalled).toBe(true);
    });

    it("Caso 3 — doação ultrapassa a meta: rejeita com erro de domínio (Meta = 1000, Arrecadado = 800, Doação = 201 -> rejeitado)", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-3",
        titulo: "Ração medicada",
        descricao: null,
        metaArrecadacao: 1000,
        valorArrecadado: 800,
        isActive: true,
        createdAt: "2026-09-16T10:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new RegisterDonationUseCase(repository);

      await expect(useCase.execute("urg-3", 201)).rejects.toThrowError(ValidationError);
      await expect(useCase.execute("urg-3", 201)).rejects.toThrowError(
        "valorArrecadado não pode ser maior que metaArrecadacao",
      );
    });

    it("Caso 4 — garantia de não persistência: quando a doação ultrapassar a meta, o repository NÃO persiste nada", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-4",
        titulo: "Fisioterapia",
        descricao: null,
        metaArrecadacao: 1000,
        valorArrecadado: 800,
        isActive: true,
        createdAt: "2026-09-16T10:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new RegisterDonationUseCase(repository);

      await expect(useCase.execute("urg-4", 250)).rejects.toThrowError(ValidationError);

      expect(repository.updateValorArrecadadoCalled).toBe(false);
      expect(repository.items[0]?.valorArrecadado).toBe(800);
    });

    it("deve rejeitar doação com valor menor ou igual a zero", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-5",
        titulo: "Exames",
        descricao: null,
        metaArrecadacao: 500,
        valorArrecadado: 100,
        isActive: true,
        createdAt: "2026-09-16T10:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new RegisterDonationUseCase(repository);

      await expect(useCase.execute("urg-5", 0)).rejects.toThrowError(ValidationError);
      await expect(useCase.execute("urg-5", -50)).rejects.toThrowError(ValidationError);
      expect(repository.updateValorArrecadadoCalled).toBe(false);
    });

    it("deve permitir doação em urgência sem meta definida", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-no-goal",
        titulo: "Fundo de emergência",
        descricao: null,
        metaArrecadacao: null,
        valorArrecadado: 100,
        isActive: true,
        createdAt: "2026-09-16T10:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new RegisterDonationUseCase(repository);
      const result = await useCase.execute("urg-no-goal", 500);

      expect(result.valorArrecadado).toBe(600);
      expect(result.metaArrecadacao).toBeNull();
      expect(repository.updateValorArrecadadoCalled).toBe(true);
    });

    it("deve lançar NotFoundError se a urgência não existir", async () => {
      const useCase = new RegisterDonationUseCase(repository);

      await expect(useCase.execute("inexistente", 100)).rejects.toThrowError(NotFoundError);
      expect(repository.updateValorArrecadadoCalled).toBe(false);
    });
  });

  describe("CreateUrgencyUseCase", () => {
    it("deve criar uma urgência válida acionando Urgency.create() e persistindo", async () => {
      const useCase = new CreateUrgencyUseCase(repository);
      const input: CreateUrgencyDTO = {
        titulo: "Castração de 10 cães",
        descricao: "Campanha comunitária",
        metaArrecadacao: 2000,
        valorArrecadado: 500,
        isActive: true,
      };

      const result = await useCase.execute(input);

      expect(result.id).toBe("fake-uuid-1");
      expect(result.titulo).toBe("Castração de 10 cães");
      expect(result.valorArrecadado).toBe(500);
      expect(result.metaArrecadacao).toBe(2000);
      expect(repository.items.length).toBe(1);
    });

    it("deve rejeitar e não persistir quando dados violarem invariantes de domínio", async () => {
      const useCase = new CreateUrgencyUseCase(repository);
      const invalidInput: CreateUrgencyDTO = {
        titulo: "Inválida",
        metaArrecadacao: 500,
        valorArrecadado: 800, // Maior que a meta na criação!
        isActive: true,
      };

      await expect(useCase.execute(invalidInput)).rejects.toThrowError(ValidationError);
      expect(repository.items.length).toBe(0);
    });

    it("deve persistir o titulo já trimado pela entidade, não o input crú", async () => {
      const useCase = new CreateUrgencyUseCase(repository);
      const input: CreateUrgencyDTO = {
        titulo: "  Ração para cães resgatados  ",
        valorArrecadado: 0,
        isActive: false,
      };

      const result = await useCase.execute(input);

      expect(result.titulo).toBe("Ração para cães resgatados");
      expect(repository.items[0]?.titulo).toBe("Ração para cães resgatados");
    });
  });

  describe("GetUrgencyUseCase", () => {
    it("deve buscar e retornar uma urgência existente como DTO", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-10",
        titulo: "Raio-X de emergência",
        descricao: "Pata fraturada",
        metaArrecadacao: 350,
        valorArrecadado: 100,
        isActive: true,
        createdAt: "2026-09-16T11:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new GetUrgencyUseCase(repository);
      const result = await useCase.execute("urg-10");

      expect(result).toEqual({
        id: "urg-10",
        titulo: "Raio-X de emergência",
        descricao: "Pata fraturada",
        metaArrecadacao: 350,
        valorArrecadado: 100,
        unidade: "R$",
        prioridade: "importante",
        tipo: "outros",
        dataLimite: null,
        isActive: true,
        createdAt: "2026-09-16T11:00:00Z",
      });
    });

    it("deve lançar NotFoundError quando a urgência não for encontrada", async () => {
      const useCase = new GetUrgencyUseCase(repository);
      await expect(useCase.execute("id-inexistente")).rejects.toThrowError(NotFoundError);
    });
  });

  describe("ListUrgenciesUseCase", () => {
    it("deve listar todas as urgências convertidas em DTOs", async () => {
      repository.items.push(
        Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
          id: "1",
          titulo: "Urgência 1",
          descricao: null,
          metaArrecadacao: 100,
          valorArrecadado: 50,
          isActive: true,
          createdAt: "2026-09-16T10:00:00Z",
        }),
        Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
          id: "2",
          titulo: "Urgência 2",
          descricao: null,
          metaArrecadacao: 200,
          valorArrecadado: 150,
          isActive: false,
          createdAt: "2026-09-16T11:00:00Z",
        }),
      );

      const useCase = new ListUrgenciesUseCase(repository);
      const results = await useCase.execute();

      expect(results.length).toBe(2);
      expect(results[0]?.titulo).toBe("Urgência 1");
      expect(results[1]?.titulo).toBe("Urgência 2");
    });
  });

  describe("UpdateUrgencyUseCase", () => {
    it("deve atualizar os dados da urgência respeitando regras de domínio", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-edit",
        titulo: "Título Inicial",
        descricao: null,
        metaArrecadacao: 500,
        valorArrecadado: 100,
        isActive: false,
        createdAt: "2026-09-16T10:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new UpdateUrgencyUseCase(repository);
      const result = await useCase.execute("urg-edit", {
        titulo: "Título Atualizado",
        isActive: true,
      });

      expect(result.titulo).toBe("Título Atualizado");
      expect(result.isActive).toBe(true);
      expect(repository.updateCalled).toBe(true);
    });

    it("deve rejeitar atualização se valorArrecadado ficar maior que a meta", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-edit-2",
        titulo: "Campanha",
        descricao: null,
        metaArrecadacao: 500,
        valorArrecadado: 100,
        isActive: false,
        createdAt: "2026-09-16T10:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new UpdateUrgencyUseCase(repository);

      await expect(
        useCase.execute("urg-edit-2", { valorArrecadado: 600 }),
      ).rejects.toThrowError(ValidationError);
      expect(repository.updateCalled).toBe(false);
    });

    it("deve persistir titulo/descricao já trimados pela entidade, não o input crú", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-edit-3",
        titulo: "Título Inicial",
        descricao: null,
        metaArrecadacao: null,
        valorArrecadado: 0,
        isActive: false,
        createdAt: "2026-09-16T10:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new UpdateUrgencyUseCase(repository);
      const result = await useCase.execute("urg-edit-3", {
        titulo: "  Campanha de Vacinação  ",
        descricao: "  Dose única  ",
      });

      expect(result.titulo).toBe("Campanha de Vacinação");
      expect(result.descricao).toBe("Dose única");
    });
  });

  describe("DeleteUrgencyUseCase", () => {
    it("deve remover uma urgência existente", async () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-del",
        titulo: "Para deletar",
        descricao: null,
        metaArrecadacao: 500,
        valorArrecadado: 0,
        isActive: false,
        createdAt: "2026-09-16T10:00:00Z",
      });
      repository.items.push(urgency);

      const useCase = new DeleteUrgencyUseCase(repository);
      await useCase.execute("urg-del");

      expect(repository.removeCalled).toBe(true);
      expect(repository.items.length).toBe(0);
    });

    it("deve lançar NotFoundError ao tentar deletar ID inexistente", async () => {
      const useCase = new DeleteUrgencyUseCase(repository);
      await expect(useCase.execute("nao-existe")).rejects.toThrowError(NotFoundError);
    });
  });

  describe("Mapper: snake_case ↔ camelCase", () => {
    it("mapRowToEntity deve converter linha crua do banco para a entidade de domínio", () => {
      const row: UrgencyRow = {
        id: "uuid-row-1",
        titulo: "Ração especial",
        descricao: "Para idosos",
        meta_arrecadacao: 800,
        valor_arrecadado: 350,
        unidade: "kg",
        prioridade: "urgente",
        tipo: "racao",
        data_limite: "2026-10-30",
        is_active: true,
        created_at: "2026-09-16T12:00:00Z",
      };

      const entity = mapRowToEntity(row);

      expect(entity).toBeInstanceOf(Urgency);
      expect(entity.id).toBe("uuid-row-1");
      expect(entity.titulo).toBe("Ração especial");
      expect(entity.descricao).toBe("Para idosos");
      expect(entity.metaArrecadacao).toBe(800);
      expect(entity.valorArrecadado).toBe(350);
      expect(entity.unidade).toBe("kg");
      expect(entity.prioridade).toBe("urgente");
      expect(entity.tipo).toBe("racao");
      expect(entity.dataLimite).toBe("2026-10-30");
      expect(entity.isActive).toBe(true);
      expect(entity.createdAt).toBe("2026-09-16T12:00:00Z");
    });

    it("mapCreateDTOToRow deve converter dados normalizados de Urgency.create() para snake_case do Postgres", () => {
      const data: UrgencyCreationData = {
        titulo: "Nova Urgência",
        descricao: "Detalhes",
        metaArrecadacao: 1500,
        valorArrecadado: 200,
        unidade: "R$",
        prioridade: "continua",
        tipo: "cirurgia",
        dataLimite: "2026-12-01",
        isActive: true,
      };

      const row = mapCreateDTOToRow(data);

      expect(row).toEqual({
        titulo: "Nova Urgência",
        descricao: "Detalhes",
        meta_arrecadacao: 1500,
        valor_arrecadado: 200,
        unidade: "R$",
        prioridade: "continua",
        tipo: "cirurgia",
        data_limite: "2026-12-01",
        is_active: true,
      });
    });

    it("mapUpdateDTOToRow deve incluir apenas os campos informados no update", () => {
      const dto: UpdateUrgencyDTO = {
        titulo: "Atualizado",
        isActive: false,
      };

      const row = mapUpdateDTOToRow(dto);

      expect(row).toEqual({
        titulo: "Atualizado",
        is_active: false,
      });
      expect(row).not.toHaveProperty("descricao");
      expect(row).not.toHaveProperty("meta_arrecadacao");
      expect(row).not.toHaveProperty("valor_arrecadado");
    });
  });
});
