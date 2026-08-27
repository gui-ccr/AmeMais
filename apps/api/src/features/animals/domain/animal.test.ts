import { describe, it, expect } from "vitest";
import { podeAlterarStatus, type AnimalStatus } from "./animal";

describe("animal domain - podeAlterarStatus", () => {
  it("não deve permitir transição para o mesmo status", () => {
    const status: AnimalStatus[] = ["disponivel", "em_tratamento", "em_lar_temporario", "adotado"];
    status.forEach((s) => {
      expect(podeAlterarStatus(s, s)).toBe(false);
    });
  });

  describe("a partir de 'em_tratamento'", () => {
    it("deve permitir ir para 'disponivel' (recuperado)", () => {
      expect(podeAlterarStatus("em_tratamento", "disponivel")).toBe(true);
    });

    it("deve permitir ir para 'em_lar_temporario' (recuperação familiar)", () => {
      expect(podeAlterarStatus("em_tratamento", "em_lar_temporario")).toBe(true);
    });

    it("não deve permitir ir direto para 'adotado'", () => {
      expect(podeAlterarStatus("em_tratamento", "adotado")).toBe(false);
    });
  });

  describe("a partir de 'disponivel'", () => {
    it("deve permitir ir para 'em_tratamento' (adoeceu)", () => {
      expect(podeAlterarStatus("disponivel", "em_tratamento")).toBe(true);
    });

    it("deve permitir ir para 'em_lar_temporario' (transferido)", () => {
      expect(podeAlterarStatus("disponivel", "em_lar_temporario")).toBe(true);
    });

    it("deve permitir ir para 'adotado' (fluxo padrão)", () => {
      expect(podeAlterarStatus("disponivel", "adotado")).toBe(true);
    });
  });

  describe("a partir de 'em_lar_temporario'", () => {
    it("deve permitir ir para 'disponivel' (retornou ao abrigo)", () => {
      expect(podeAlterarStatus("em_lar_temporario", "disponivel")).toBe(true);
    });

    it("deve permitir ir para 'em_tratamento' (adoeceu e precisa do abrigo)", () => {
      expect(podeAlterarStatus("em_lar_temporario", "em_tratamento")).toBe(true);
    });

    it("deve permitir ir para 'adotado' (foster fail ou adoção direta)", () => {
      expect(podeAlterarStatus("em_lar_temporario", "adotado")).toBe(true);
    });
  });

  describe("a partir de 'adotado'", () => {
    it("deve permitir ir para 'disponivel' (devolução sem problemas de saúde)", () => {
      expect(podeAlterarStatus("adotado", "disponivel")).toBe(true);
    });

    it("deve permitir ir para 'em_tratamento' (devolução com necessidade médica)", () => {
      expect(podeAlterarStatus("adotado", "em_tratamento")).toBe(true);
    });

    it("não deve permitir ir direto para 'em_lar_temporario' (exige triagem no abrigo)", () => {
      expect(podeAlterarStatus("adotado", "em_lar_temporario")).toBe(false);
    });
  });
});
