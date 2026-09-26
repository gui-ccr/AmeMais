import { describe, expect, it } from "vitest";
import { Animal, type NewAnimalProps, type AdotanteInfo } from "../src/features/animals/domain/animal.entity";
import { AnimalStatus } from "../src/features/animals/domain/animal-status.vo";
import { ValidationError } from "../src/core/errors";

const adotanteValido: AdotanteInfo = {
  nome: "Maria Silva",
  idade: 30,
  cep: "39800000",
  localidade: "Teófilo Otoni",
};

function inputAdotadoValido(overrides: Partial<NewAnimalProps> = {}): NewAnimalProps {
  return {
    nome: "Rex",
    especie: "Cachorro",
    raca: "Vira-lata",
    status: "adotado",
    urlFoto: "https://exemplo.com/rex.png",
    adotante: adotanteValido,
    dataAdocao: "2026-01-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("Animal Entity (Domain Layer)", () => {
  describe("Animal.create() - cadastro de animal já adotado (caso válido)", () => {
    it("deve criar com sucesso um animal adotado com todos os dados obrigatórios", () => {
      const input = inputAdotadoValido();

      const result = Animal.create(input);

      expect(result.status.valor).toBe("adotado");
      expect(result.adotante).toEqual(adotanteValido);
      expect(result.dataAdocao).toBe("2026-01-10T00:00:00.000Z");
      expect(result.especie).toBe("Cachorro");
      expect(result.raca).toBe("Vira-lata");
      expect(result.urlFoto).toBe("https://exemplo.com/rex.png");
    });
  });

  describe("Animal.create() - animal adotado com dados obrigatórios ausentes/inválidos", () => {
    it("deve rejeitar quando a espécie estiver ausente", () => {
      const input = inputAdotadoValido({ especie: undefined });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("especie é obrigatória");
    });

    it("deve rejeitar quando a raça estiver ausente", () => {
      const input = inputAdotadoValido({ raca: undefined });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("raca é obrigatória");
    });

    it("deve rejeitar quando a urlFoto estiver ausente", () => {
      const input = inputAdotadoValido({ urlFoto: undefined });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("urlFoto é obrigatória");
    });

    it("deve rejeitar quando o nome do adotante estiver ausente", () => {
      const input = inputAdotadoValido({
        adotante: { ...adotanteValido, nome: "" },
      });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("nome do adotante deve ter pelo menos 2 caracteres");
    });

    it("deve rejeitar quando o nome do adotante tiver menos de 2 letras", () => {
      const input = inputAdotadoValido({
        adotante: { ...adotanteValido, nome: "A" },
      });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("nome do adotante deve ter pelo menos 2 caracteres");
    });

    it("deve rejeitar quando a idade do adotante estiver ausente", () => {
      const input = inputAdotadoValido({
        adotante: { ...adotanteValido, idade: undefined as unknown as number },
      });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("idade do adotante deve ser um número inteiro entre 1 e 120");
    });

    it("deve rejeitar quando a idade do adotante for 0", () => {
      const input = inputAdotadoValido({ adotante: { ...adotanteValido, idade: 0 } });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("idade do adotante deve ser um número inteiro entre 1 e 120");
    });

    it("deve rejeitar quando a idade do adotante for 121", () => {
      const input = inputAdotadoValido({ adotante: { ...adotanteValido, idade: 121 } });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("idade do adotante deve ser um número inteiro entre 1 e 120");
    });

    it("deve rejeitar quando a idade do adotante for decimal", () => {
      const input = inputAdotadoValido({ adotante: { ...adotanteValido, idade: 18.5 } });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("idade do adotante deve ser um número inteiro entre 1 e 120");
    });

    it("deve aceitar os limites válidos de idade (1 e 120)", () => {
      expect(() => Animal.create(inputAdotadoValido({ adotante: { ...adotanteValido, idade: 1 } }))).not.toThrow();
      expect(() => Animal.create(inputAdotadoValido({ adotante: { ...adotanteValido, idade: 120 } }))).not.toThrow();
    });

    it("deve rejeitar quando o CEP do adotante estiver ausente", () => {
      const input = inputAdotadoValido({ adotante: { ...adotanteValido, cep: "" } });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("cep do adotante deve conter exatamente 8 números");
    });

    it("deve rejeitar CEP com 7 números", () => {
      const input = inputAdotadoValido({ adotante: { ...adotanteValido, cep: "1234567" } });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("cep do adotante deve conter exatamente 8 números");
    });

    it("deve rejeitar CEP com caractere não numérico", () => {
      const input = inputAdotadoValido({ adotante: { ...adotanteValido, cep: "1234567A" } });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("cep do adotante deve conter exatamente 8 números");
    });

    it("deve rejeitar quando a localidade do adotante estiver ausente", () => {
      const input = inputAdotadoValido({ adotante: { ...adotanteValido, localidade: "" } });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("localidade do adotante é obrigatória");
    });

    it("deve rejeitar quando a dataAdocao estiver ausente", () => {
      const input = inputAdotadoValido({ dataAdocao: undefined });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("dataAdocao é obrigatória");
    });

    it("deve rejeitar quando a dataAdocao estiver no futuro", () => {
      const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const input = inputAdotadoValido({ dataAdocao: amanha });

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError("dataAdocao não pode estar no futuro");
    });
  });

  describe("Animal.create() - regra inversa (status não adotado não pode ter dados de adoção)", () => {
    it("deve rejeitar status disponivel com adotante informado", () => {
      const input: NewAnimalProps = {
        nome: "Bidu",
        status: "disponivel",
        adotante: adotanteValido,
      };

      expect(() => Animal.create(input)).toThrowError(ValidationError);
      expect(() => Animal.create(input)).toThrowError(
        'Dados do adotante e data de adoção só podem ser informados quando o status é "adotado"',
      );
    });

    it("deve rejeitar status disponivel com dataAdocao informada", () => {
      const input: NewAnimalProps = {
        nome: "Bidu",
        status: "disponivel",
        dataAdocao: "2026-01-10T00:00:00.000Z",
      };

      expect(() => Animal.create(input)).toThrowError(ValidationError);
    });

    it("deve rejeitar status em_tratamento com adotante informado", () => {
      const input: NewAnimalProps = {
        nome: "Bidu",
        status: "em_tratamento",
        adotante: adotanteValido,
      };

      expect(() => Animal.create(input)).toThrowError(ValidationError);
    });
  });

  describe("Animal.changeStatus() - devolução de animal adotado", () => {
    it("deve limpar adotante e dataAdocao quando um animal adotado é devolvido", () => {
      const dadosCriados = Animal.create(inputAdotadoValido());
      const animal = Animal.restore({
        id: "animal-1",
        createdAt: "2026-01-10T00:00:00.000Z",
        ...dadosCriados,
      });

      expect(animal.adotante).toEqual(adotanteValido);
      expect(animal.dataAdocao).toBe("2026-01-10T00:00:00.000Z");

      animal.changeStatus(AnimalStatus.from("disponivel"));

      expect(animal.status.valor).toBe("disponivel");
      expect(animal.adotante).toBeNull();
      expect(animal.dataAdocao).toBeNull();
    });
  });
});
