import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Animal } from "../src/features/animals/domain/animal.entity";
import { Adotante } from "../src/features/animals/domain/adotante.vo";
import { AnimalStatus } from "../src/features/animals/domain/animal-status.vo";
import { ValidationError } from "../src/core/errors";
import { toAnimalDTO } from "../src/features/animals/animal.dto";
import { createAnimalSchema } from "../src/features/animals/schema";
import {
  ADOCAO_LIMPA,
  mapCreateDTOToRow,
  mapRowToEntity,
  type AnimalRow,
} from "../src/features/animals/mapper";
import { AnimalRepository } from "../src/features/animals/animal.repository";
import { CreateAnimalUseCase } from "../src/features/animals/use-cases/create-animal.use-case";

/** Relógio fixo: 25/09/2026 às 12h em Brasília. */
const AGORA = new Date("2026-09-25T15:00:00.000Z");

const ADOTANTE = { nome: "Maria Souza", idade: 34, cep: "39800-000", localidade: "Teófilo Otoni - MG" };

function animalAdotado() {
  return Animal.restore({
    id: "a1",
    nome: "Thor",
    especie: "Cachorro",
    raca: "SRD",
    status: AnimalStatus.from("adotado"),
    urlFoto: null,
    larTemporarioId: null,
    adotanteId: null,
    adotante: Adotante.from(ADOTANTE),
    dataAdocao: "2026-09-10",
    createdAt: "2026-09-10T12:00:00.000Z",
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(AGORA);
});
afterEach(() => vi.useRealTimers());

describe("Adotante (Value Object)", () => {
  it("normaliza: nome aparado e CEP só com os 8 dígitos", () => {
    const adotante = Adotante.from({ ...ADOTANTE, nome: "  Maria Souza  " });

    expect(adotante.nome).toBe("Maria Souza");
    expect(adotante.cep).toBe("39800000");
  });

  it("aceita o CEP com ou sem máscara", () => {
    expect(Adotante.from({ ...ADOTANTE, cep: "39800000" }).cep).toBe("39800000");
  });

  it.each([0, -3, 121, 34.5, Number.NaN])("rejeita idade inválida (%s)", (idade) => {
    expect(() => Adotante.from({ ...ADOTANTE, idade })).toThrow(ValidationError);
  });

  it("aceita os limites 1 e 120", () => {
    expect(() => Adotante.from({ ...ADOTANTE, idade: 1 })).not.toThrow();
    expect(() => Adotante.from({ ...ADOTANTE, idade: 120 })).not.toThrow();
  });

  it("rejeita nome curto, CEP incompleto e localidade vazia", () => {
    expect(() => Adotante.from({ ...ADOTANTE, nome: "M" })).toThrow(ValidationError);
    expect(() => Adotante.from({ ...ADOTANTE, cep: "3980" })).toThrow(ValidationError);
    expect(() => Adotante.from({ ...ADOTANTE, localidade: " " })).toThrow(ValidationError);
  });
});

describe("Animal.create() — cadastro de animal já adotado", () => {
  it("cria adotado com adotante e data, normalizando os dados", () => {
    const data = Animal.create({
      nome: "  Thor ",
      especie: "Cachorro",
      raca: "SRD",
      status: "adotado",
      adotante: ADOTANTE,
      dataAdocao: "2026-09-10",
    });

    expect(data.nome).toBe("Thor");
    expect(data.status.valor).toBe("adotado");
    expect(data.adotante?.cep).toBe("39800000");
    expect(data.dataAdocao).toBe("2026-09-10");
  });

  it("aceita adoção registrada hoje", () => {
    expect(() =>
      Animal.create({ nome: "Thor", status: "adotado", adotante: ADOTANTE, dataAdocao: "2026-09-25" }),
    ).not.toThrow();
  });

  it("às 23h em Brasília (já 26/09 em UTC) 'hoje' ainda é 25/09", () => {
    vi.setSystemTime(new Date("2026-09-26T02:00:00.000Z"));

    expect(() =>
      Animal.create({ nome: "Thor", status: "adotado", adotante: ADOTANTE, dataAdocao: "2026-09-25" }),
    ).not.toThrow();
    expect(() =>
      Animal.create({ nome: "Thor", status: "adotado", adotante: ADOTANTE, dataAdocao: "2026-09-26" }),
    ).toThrow(ValidationError);
  });

  it("rejeita data de adoção futura", () => {
    expect(() =>
      Animal.create({ nome: "Thor", status: "adotado", adotante: ADOTANTE, dataAdocao: "2026-09-26" }),
    ).toThrow(/futura/);
  });

  it("rejeita data que não existe no calendário", () => {
    expect(() =>
      Animal.create({ nome: "Thor", status: "adotado", adotante: ADOTANTE, dataAdocao: "2026-02-30" }),
    ).toThrow(ValidationError);
  });

  it("exige adotante e data quando o status é adotado", () => {
    expect(() => Animal.create({ nome: "Thor", status: "adotado", dataAdocao: "2026-09-10" })).toThrow(/adotante/);
    expect(() => Animal.create({ nome: "Thor", status: "adotado", adotante: ADOTANTE })).toThrow(/dataAdocao/);
  });

  it("NÃO aceita dados de adotante em animal que não está adotado", () => {
    expect(() => Animal.create({ nome: "Thor", status: "disponivel", adotante: ADOTANTE })).toThrow(ValidationError);
    expect(() => Animal.create({ nome: "Thor", dataAdocao: "2026-09-10" })).toThrow(ValidationError);
  });

  it("continua bloqueando status que exigem histórico (lar temporário)", () => {
    expect(() => Animal.create({ nome: "Thor", status: "em_lar_temporario" })).toThrow(ValidationError);
  });

  it("valida a espécie contra a lista fixa", () => {
    expect(() => Animal.create({ nome: "Thor", especie: "Cachorro" })).not.toThrow();
    expect(() => Animal.create({ nome: "Thor", especie: "Outro" })).not.toThrow();
    expect(() => Animal.create({ nome: "Thor", especie: "Dragão" })).toThrow(ValidationError);
  });

  it("animal disponível nasce sem dados de adoção", () => {
    const data = Animal.create({ nome: "Thor" });

    expect(data.adotante).toBeNull();
    expect(data.dataAdocao).toBeNull();
  });
});

describe("Animal.changeStatus() — privacidade do adotante", () => {
  it("devolver o animal (adotado -> disponivel) apaga os dados da adoção", () => {
    const animal = animalAdotado();

    animal.changeStatus(AnimalStatus.from("disponivel"));

    expect(animal.adotante).toBeNull();
    expect(animal.dataAdocao).toBeNull();
    expect(animal.adotanteId).toBeNull();
  });

  it("mudar entre status que não são 'adotado' também não deixa dados sobrar", () => {
    const animal = animalAdotado();

    animal.changeStatus(AnimalStatus.from("em_tratamento"));

    expect(animal.adotante).toBeNull();
  });
});

describe("mapper e DTO", () => {
  const linha: AnimalRow = {
    id: "a1",
    nome: "Thor",
    especie: "Cachorro",
    raca: "SRD",
    status_adocao: "adotado",
    lar_temporario_id: null,
    adotante_id: null,
    url_foto: null,
    data_adocao: "2026-09-10",
    adotante_nome: "Maria Souza",
    adotante_idade: 34,
    adotante_cep: "39800000",
    adotante_localidade: "Teófilo Otoni - MG",
    created_at: "2026-09-10T12:00:00Z",
  };

  it("mapRowToEntity reconstrói o adotante a partir das 4 colunas", () => {
    const animal = mapRowToEntity(linha);

    expect(animal.adotante?.nome).toBe("Maria Souza");
    expect(animal.adotante?.cep).toBe("39800000");
  });

  it("mapRowToEntity devolve adotante null quando as colunas estão vazias", () => {
    const animal = mapRowToEntity({
      ...linha,
      status_adocao: "disponivel",
      adotante_nome: null,
      adotante_idade: null,
      adotante_cep: null,
      adotante_localidade: null,
      data_adocao: null,
    });

    expect(animal.adotante).toBeNull();
  });

  it("mapCreateDTOToRow grava os dados normalizados em snake_case", () => {
    const row = mapCreateDTOToRow(
      Animal.create({ nome: " Thor ", status: "adotado", adotante: ADOTANTE, dataAdocao: "2026-09-10" }),
    );

    expect(row).toMatchObject({
      nome: "Thor",
      status_adocao: "adotado",
      adotante_nome: "Maria Souza",
      adotante_idade: 34,
      adotante_cep: "39800000",
      adotante_localidade: "Teófilo Otoni - MG",
      data_adocao: "2026-09-10",
    });
  });

  it("toAnimalDTO expõe o adotante (ou null)", () => {
    expect(toAnimalDTO(animalAdotado()).adotante).toEqual({
      nome: "Maria Souza",
      idade: 34,
      cep: "39800000",
      localidade: "Teófilo Otoni - MG",
    });
    expect(toAnimalDTO(mapRowToEntity({ ...linha, ...ADOCAO_LIMPA, status_adocao: "disponivel" })).adotante).toBeNull();
  });
});

describe("createAnimalSchema", () => {
  it("aceita o contrato do cadastro de animal adotado", () => {
    const parsed = createAnimalSchema.parse({
      nome: "Thor",
      especie: "Cachorro",
      raca: "SRD",
      urlFoto: "https://exemplo.com/animais/abc.jpg",
      status: "adotado",
      adotante: { nome: "Maria Souza", idade: 34, cep: "39800-000", localidade: "Teófilo Otoni - MG" },
      dataAdocao: "2026-09-10",
    });

    expect(parsed.adotante?.idade).toBe(34);
  });

  it("rejeita espécie fora da lista e data em formato errado", () => {
    expect(() => createAnimalSchema.parse({ nome: "Thor", especie: "cachorro" })).toThrow();
    expect(() => createAnimalSchema.parse({ nome: "Thor", dataAdocao: "10/09/2026" })).toThrow();
  });
});

describe("CreateAnimalUseCase", () => {
  it("persiste os dados NORMALIZADOS pela entidade, não o input cru", async () => {
    const create = vi.fn(async (data: Parameters<AnimalRepository["create"]>[0]) =>
      Animal.restore({ id: "novo", createdAt: "2026-09-25T15:00:00Z", ...data }),
    );

    const useCase = new CreateAnimalUseCase({ create } as unknown as AnimalRepository);
    const dto = await useCase.execute({
      nome: "  Thor  ",
      status: "adotado",
      adotante: ADOTANTE,
      dataAdocao: "2026-09-10",
    });

    const persistido = create.mock.calls[0]![0];
    expect(persistido.nome).toBe("Thor");
    expect(persistido.adotante?.cep).toBe("39800000");
    expect(dto.adotante?.cep).toBe("39800000");
  });
});

describe("AnimalRepository.updateStatus — privacidade no banco", () => {
  function repositorioEspiao() {
    let payload: Record<string, unknown> = {};
    const linha = {
      id: "a1",
      nome: "Thor",
      especie: "Cachorro",
      raca: null,
      status_adocao: "disponivel",
      lar_temporario_id: null,
      adotante_id: null,
      url_foto: null,
      data_adocao: null,
      adotante_nome: null,
      adotante_idade: null,
      adotante_cep: null,
      adotante_localidade: null,
      created_at: "2026-09-10T12:00:00Z",
    };
    const db = {
      from: () => ({
        update: (p: Record<string, unknown>) => {
          payload = p;
          return { eq: () => ({ select: () => ({ single: async () => ({ data: linha, error: null }) }) }) };
        },
      }),
    } as unknown as SupabaseClient;

    return { repository: new AnimalRepository(db), payload: () => payload };
  }

  it("ao sair de 'adotado', zera adotante_* e data_adocao na mesma escrita", async () => {
    const { repository, payload } = repositorioEspiao();

    await repository.updateStatus("a1", AnimalStatus.from("disponivel"));

    expect(payload()).toMatchObject({ status_adocao: "disponivel", ...ADOCAO_LIMPA });
  });

  it("ao ir para 'adotado', só troca o status (não apaga nada)", async () => {
    const { repository, payload } = repositorioEspiao();

    await repository.updateStatus("a1", AnimalStatus.from("adotado"));

    expect(payload()).toEqual({ status_adocao: "adotado" });
  });
});
