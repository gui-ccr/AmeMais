import { describe, expect, it } from "vitest";
import { Urgency, type NewUrgencyProps } from "../src/features/urgencies/domain/urgency.entity";
import { ValidationError } from "../src/core/errors";
import { toUrgencyDTO } from "../src/features/urgencies/urgency.dto";
import { createUrgencySchema } from "../src/features/urgencies/schema";

describe("Urgency Entity (Domain Layer)", () => {
  describe("Urgency.create() - Casos Válidos", () => {
    it("deve criar com sucesso quando dados são válidos (valorArrecadado < metaArrecadacao)", () => {
      const input: NewUrgencyProps = {
        titulo: "Ajuda para cirurgia",
        descricao: "Custos do procedimento emergencial",
        valorArrecadado: 500,
        metaArrecadacao: 1000,
        isActive: true,
      };

      const result = Urgency.create(input);

      expect(result).toEqual({
        titulo: "Ajuda para cirurgia",
        descricao: "Custos do procedimento emergencial",
        valorArrecadado: 500,
        metaArrecadacao: 1000,
        unidade: "R$",
        prioridade: "importante",
        tipo: "outros",
        dataLimite: null,
        isActive: true,
      });
    });

    it("deve criar com sucesso quando arrecadação é exatamente igual à meta (valorArrecadado === metaArrecadacao)", () => {
      const input: NewUrgencyProps = {
        titulo: "Ajuda para cirurgia",
        valorArrecadado: 1000,
        metaArrecadacao: 1000,
      };

      const result = Urgency.create(input);

      expect(result.valorArrecadado).toBe(1000);
      expect(result.metaArrecadacao).toBe(1000);
      expect(result.titulo).toBe("Ajuda para cirurgia");
      expect(result.isActive).toBe(false);
      expect(result.descricao).toBeNull();
    });

    it("deve criar com sucesso quando metaArrecadacao não for informada (campanha sem meta fixa)", () => {
      const input: NewUrgencyProps = {
        titulo: "Doação de medicamentos",
        valorArrecadado: 150,
      };

      const result = Urgency.create(input);

      expect(result.valorArrecadado).toBe(150);
      expect(result.metaArrecadacao).toBeNull();
    });

    it("deve aplicar valores padrão (valorArrecadado = 0, isActive = false) quando omitidos", () => {
      const input: NewUrgencyProps = {
        titulo: "Resgate e cuidados",
        metaArrecadacao: 800,
      };

      const result = Urgency.create(input);

      expect(result.valorArrecadado).toBe(0);
      expect(result.isActive).toBe(false);
      expect(result.descricao).toBeNull();
    });
  });

  describe("Urgency.create() - Casos Inválidos (Erros de Domínio)", () => {
    it("deve rejeitar e lançar ValidationError quando arrecadação for maior que a meta (valorArrecadado > metaArrecadacao)", () => {
      const input: NewUrgencyProps = {
        titulo: "Ajuda para cirurgia",
        valorArrecadado: 1200,
        metaArrecadacao: 1000,
      };

      expect(() => Urgency.create(input)).toThrowError(ValidationError);
      expect(() => Urgency.create(input)).toThrowError("valorArrecadado não pode ser maior que metaArrecadacao");
    });

    it("deve rejeitar e lançar ValidationError quando título for vazio", () => {
      const input: NewUrgencyProps = {
        titulo: "",
        valorArrecadado: 500,
        metaArrecadacao: 1000,
      };

      expect(() => Urgency.create(input)).toThrowError(ValidationError);
      expect(() => Urgency.create(input)).toThrowError("titulo é obrigatório");
    });

    it("deve rejeitar e lançar ValidationError quando título for ausente (undefined ou null)", () => {
      const input = {
        titulo: undefined as unknown as string,
        valorArrecadado: 500,
        metaArrecadacao: 1000,
      };

      expect(() => Urgency.create(input)).toThrowError(ValidationError);
      expect(() => Urgency.create(input)).toThrowError("titulo é obrigatório");
    });

    it("deve rejeitar e lançar ValidationError quando título contiver somente espaços", () => {
      const input: NewUrgencyProps = {
        titulo: "     ",
        valorArrecadado: 500,
        metaArrecadacao: 1000,
      };

      expect(() => Urgency.create(input)).toThrowError(ValidationError);
      expect(() => Urgency.create(input)).toThrowError("titulo é obrigatório");
    });

    it("deve rejeitar e lançar ValidationError quando título tiver menos de 2 caracteres úteis", () => {
      const input: NewUrgencyProps = {
        titulo: "A",
        valorArrecadado: 500,
        metaArrecadacao: 1000,
      };

      expect(() => Urgency.create(input)).toThrowError(ValidationError);
      expect(() => Urgency.create(input)).toThrowError("titulo deve ter pelo menos 2 caracteres");
    });

    it("deve rejeitar e lançar ValidationError quando valorArrecadado for negativo", () => {
      const input: NewUrgencyProps = {
        titulo: "Ajuda para cirurgia",
        valorArrecadado: -100,
        metaArrecadacao: 1000,
      };

      expect(() => Urgency.create(input)).toThrowError(ValidationError);
      expect(() => Urgency.create(input)).toThrowError("valorArrecadado não pode ser negativo");
    });

    it("deve rejeitar e lançar ValidationError quando metaArrecadacao for negativa", () => {
      const input: NewUrgencyProps = {
        titulo: "Ajuda para cirurgia",
        valorArrecadado: 0,
        metaArrecadacao: -500,
      };

      expect(() => Urgency.create(input)).toThrowError(ValidationError);
      expect(() => Urgency.create(input)).toThrowError("metaArrecadacao não pode ser negativa");
    });
  });

  describe("Urgency.restore()", () => {
    it("deve restaurar uma entidade persistida sem revalidar regras de criação", () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "123e4567-e89b-12d3-a456-426614174000",
        titulo: "Cirurgia ortopédica",
        descricao: "Fixador externo",
        metaArrecadacao: 2500,
        valorArrecadado: 1200,
        isActive: true,
        createdAt: "2026-09-14T20:00:00.000Z",
      });

      expect(urgency.id).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(urgency.titulo).toBe("Cirurgia ortopédica");
      expect(urgency.descricao).toBe("Fixador externo");
      expect(urgency.metaArrecadacao).toBe(2500);
      expect(urgency.valorArrecadado).toBe(1200);
      expect(urgency.isActive).toBe(true);
      expect(urgency.createdAt).toBe("2026-09-14T20:00:00.000Z");
    });
  });

  describe("Operações de negócio da entidade (update e registrarArrecadacao)", () => {
    it("deve atualizar campos mantendo as invariantes protegidas", () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-1",
        titulo: "Ração especial",
        descricao: null,
        metaArrecadacao: 1000,
        valorArrecadado: 300,
        isActive: false,
        createdAt: "2026-09-14T00:00:00Z",
      });

      urgency.update({
        titulo: "Ração hipoalergênica",
        descricao: "Para cães alérgicos",
        isActive: true,
      });

      expect(urgency.titulo).toBe("Ração hipoalergênica");
      expect(urgency.descricao).toBe("Para cães alérgicos");
      expect(urgency.isActive).toBe(true);
    });

    it("deve rejeitar update que tente colocar valorArrecadado maior que a meta", () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-1",
        titulo: "Ração especial",
        descricao: null,
        metaArrecadacao: 500,
        valorArrecadado: 300,
        isActive: false,
        createdAt: "2026-09-14T00:00:00Z",
      });

      expect(() => urgency.update({ valorArrecadado: 600 })).toThrowError(ValidationError);
    });

    it("deve registrar nova arrecadação somando ao total", () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-1",
        titulo: "Campanha Castração",
        descricao: null,
        metaArrecadacao: 500,
        valorArrecadado: 200,
        isActive: true,
        createdAt: "2026-09-14T00:00:00Z",
      });

      urgency.registrarArrecadacao(150);
      expect(urgency.valorArrecadado).toBe(350);
    });

    it("deve rejeitar registrarArrecadacao quando o valor ultrapassar a meta", () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-1",
        titulo: "Campanha Castração",
        descricao: null,
        metaArrecadacao: 500,
        valorArrecadado: 400,
        isActive: true,
        createdAt: "2026-09-14T00:00:00Z",
      });

      expect(() => urgency.registrarArrecadacao(150)).toThrowError(ValidationError);
      expect(urgency.valorArrecadado).toBe(400); // Invariante mantida intacta
    });
  });

  describe("Integração com DTO e Schema", () => {
    it("toUrgencyDTO deve mapear a entidade para o contrato serializável de saída da API", () => {
      const urgency = Urgency.restore({
        unidade: "R$", prioridade: "importante", tipo: "outros", dataLimite: null,
        id: "urg-123",
        titulo: "Cirurgia",
        descricao: "Ajuda médica",
        metaArrecadacao: 1500,
        valorArrecadado: 750,
        isActive: true,
        createdAt: "2026-09-14T10:00:00Z",
      });

      const dto = toUrgencyDTO(urgency);

      expect(dto).toEqual({
        id: "urg-123",
        titulo: "Cirurgia",
        descricao: "Ajuda médica",
        metaArrecadacao: 1500,
        valorArrecadado: 750,
        unidade: "R$",
        prioridade: "importante",
        tipo: "outros",
        dataLimite: null,
        isActive: true,
        createdAt: "2026-09-14T10:00:00Z",
      });
    });

    it("createUrgencySchema deve validar o formato estrutural de entrada", () => {
      const input = {
        titulo: "Ajuda para cirurgia",
        descricao: "Procedimento",
        metaArrecadacao: 1000,
        valorArrecadado: 500,
        isActive: true,
      };

      const parsed = createUrgencySchema.parse(input);
      expect(parsed.titulo).toBe("Ajuda para cirurgia");
      expect(parsed.valorArrecadado).toBe(500);
      expect(parsed.metaArrecadacao).toBe(1000);
    });
  });
});
