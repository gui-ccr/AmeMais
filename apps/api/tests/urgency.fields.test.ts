import { describe, expect, it } from "vitest";
import { Urgency } from "../src/features/urgencies/domain/urgency.entity";
import { createUrgencySchema, updateUrgencySchema } from "../src/features/urgencies/schema";
import { ValidationError } from "../src/core/errors";

function urgenciaExistente() {
  return Urgency.restore({
    id: "u1",
    titulo: "Ração medicada",
    descricao: null,
    metaArrecadacao: 20,
    valorArrecadado: 9,
    unidade: "kg",
    prioridade: "urgente",
    tipo: "racao",
    dataLimite: "2026-10-30",
    isActive: true,
    createdAt: "2026-09-01T00:00:00.000Z",
  });
}

describe("Urgency: prioridade, tipo, unidade e dataLimite", () => {
  describe("create()", () => {
    it("aplica padrões neutros quando os campos não são informados", () => {
      const data = Urgency.create({ titulo: "Cobertores" });

      expect(data.prioridade).toBe("importante");
      expect(data.tipo).toBe("outros");
      expect(data.unidade).toBe("R$");
      expect(data.dataLimite).toBeNull();
    });

    it("guarda os valores informados", () => {
      const data = Urgency.create({
        titulo: "Ração",
        prioridade: "urgente",
        tipo: "racao",
        unidade: "kg",
        dataLimite: "2026-10-30",
        metaArrecadacao: 20,
      });

      expect(data).toMatchObject({ prioridade: "urgente", tipo: "racao", unidade: "kg", dataLimite: "2026-10-30" });
    });

    it("aceita data limite no passado (a tela mostra 'prazo vencido')", () => {
      expect(() => Urgency.create({ titulo: "Ração", dataLimite: "2020-01-01" })).not.toThrow();
    });

    it("rejeita valores fora das listas fixas", () => {
      // @ts-expect-error valor propositalmente inválido
      expect(() => Urgency.create({ titulo: "Ração", prioridade: "critica" })).toThrow(ValidationError);
      // @ts-expect-error valor propositalmente inválido
      expect(() => Urgency.create({ titulo: "Ração", tipo: "brinquedo" })).toThrow(ValidationError);
      // @ts-expect-error valor propositalmente inválido
      expect(() => Urgency.create({ titulo: "Ração", unidade: "g" })).toThrow(ValidationError);
    });

    it("rejeita datas que não existem no calendário ou em formato errado", () => {
      expect(() => Urgency.create({ titulo: "Ração", dataLimite: "2026-02-30" })).toThrow(ValidationError);
      expect(() => Urgency.create({ titulo: "Ração", dataLimite: "30/10/2026" })).toThrow(ValidationError);
    });
  });

  describe("update()", () => {
    it("altera só os campos enviados", () => {
      const urgencia = urgenciaExistente();

      urgencia.update({ prioridade: "continua" });

      expect(urgencia.prioridade).toBe("continua");
      expect(urgencia.tipo).toBe("racao");
      expect(urgencia.unidade).toBe("kg");
      expect(urgencia.dataLimite).toBe("2026-10-30");
    });

    it("null em dataLimite remove o prazo", () => {
      const urgencia = urgenciaExistente();

      urgencia.update({ dataLimite: null });

      expect(urgencia.dataLimite).toBeNull();
    });

    it("rejeita prioridade inválida sem alterar o estado", () => {
      const urgencia = urgenciaExistente();

      // @ts-expect-error valor propositalmente inválido
      expect(() => urgencia.update({ prioridade: "critica" })).toThrow(ValidationError);
      expect(urgencia.prioridade).toBe("urgente");
    });
  });

  describe("schemas", () => {
    it("POST aceita os campos novos e os opcionais ausentes", () => {
      expect(() => createUrgencySchema.parse({ titulo: "Ração" })).not.toThrow();

      const parsed = createUrgencySchema.parse({
        titulo: "Ração",
        prioridade: "urgente",
        tipo: "racao",
        unidade: "kg",
        dataLimite: "2026-10-30",
      });
      expect(parsed.unidade).toBe("kg");
    });

    it("POST rejeita enum inexistente e data fora do formato AAAA-MM-DD", () => {
      expect(() => createUrgencySchema.parse({ titulo: "Ração", prioridade: "critica" })).toThrow();
      expect(() => createUrgencySchema.parse({ titulo: "Ração", tipo: "brinquedo" })).toThrow();
      expect(() => createUrgencySchema.parse({ titulo: "Ração", unidade: "g" })).toThrow();
      expect(() => createUrgencySchema.parse({ titulo: "Ração", dataLimite: "30/10/2026" })).toThrow();
    });

    it("PATCH aceita dataLimite null para limpar o prazo", () => {
      expect(updateUrgencySchema.parse({ dataLimite: null }).dataLimite).toBeNull();
    });
  });
});
