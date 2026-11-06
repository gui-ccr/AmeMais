import { describe, expect, it } from "vitest";
import { Animal } from "../src/features/animals/domain/animal.entity";
import { AnimalStatus, type AnimalStatusValue } from "../src/features/animals/domain/animal-status.vo";
import { toAnimalDTO } from "../src/features/animals/animal.dto";
import { ListAnimalsUseCase } from "../src/features/animals/use-cases/list-animals.use-case";
import { GetAnimalUseCase } from "../src/features/animals/use-cases/get-animal.use-case";
import type { IAnimalRepository } from "../src/features/animals/animal.repository";
import { ValidationError } from "../src/core/errors";

const LAR_ID = "11111111-1111-4111-8111-111111111111";

function animal(status: AnimalStatusValue, larTemporarioId: string | null) {
  return Animal.restore({
    id: "a1",
    nome: "Bolinha",
    especie: "Cachorro",
    raca: null,
    porte: "M" as const,
    faixaEtaria: "adulto" as const,
    idadeTexto: null,
    descricao: null,
    status: AnimalStatus.from(status),
    urlFoto: null,
    larTemporarioId,
    adotanteId: null,
    adotante: null,
    dataAdocao: null,
    createdAt: "2026-10-01T12:00:00.000Z",
  });
}

describe("Animal.changeStatus() — lar temporário exige lar", () => {
  it("recusa 'em_lar_temporario' quando o animal não está em nenhum lar", () => {
    expect(() => animal("disponivel", null).changeStatus(AnimalStatus.from("em_lar_temporario"))).toThrow(
      ValidationError,
    );
    expect(() => animal("em_tratamento", null).changeStatus(AnimalStatus.from("em_lar_temporario"))).toThrow(
      /escolha o lar/,
    );
  });

  it("aceita 'em_lar_temporario' quando o animal já tem lar vinculado", () => {
    const a = animal("disponivel", LAR_ID);
    a.changeStatus(AnimalStatus.from("em_lar_temporario"));
    expect(a.status.valor).toBe("em_lar_temporario");
    expect(a.larTemporarioId).toBe(LAR_ID);
  });

  it("libera o lar ao sair de 'em_lar_temporario'", () => {
    const a = animal("em_lar_temporario", LAR_ID);
    a.changeStatus(AnimalStatus.from("disponivel"));
    expect(a.larTemporarioId).toBeNull();
  });
});

describe("Animal: lar no DTO de listagem e detalhe", () => {
  const lares = new Map([[LAR_ID, { id: LAR_ID, nomeResponsavel: "Dona Maria" }]]);
  const repository = {
    list: async () => [animal("em_lar_temporario", LAR_ID), animal("disponivel", null)],
    findById: async () => animal("em_lar_temporario", LAR_ID),
    findLaresResumo: async () => lares,
  } as unknown as IAnimalRepository;

  it("toAnimalDTO devolve lar null por padrão", () => {
    expect(toAnimalDTO(animal("disponivel", null)).lar).toBeNull();
  });

  it("lista traz o lar de quem está em lar temporário e null para os demais", async () => {
    const lista = await new ListAnimalsUseCase(repository).execute();
    expect(lista[0]!.lar).toEqual({ id: LAR_ID, nomeResponsavel: "Dona Maria" });
    expect(lista[1]!.lar).toBeNull();
  });

  it("detalhe traz o lar", async () => {
    const dto = await new GetAnimalUseCase(repository).execute("a1");
    expect(dto.lar?.nomeResponsavel).toBe("Dona Maria");
  });
});
