import { beforeEach, describe, expect, it } from "vitest";
import { BusinessRuleError, ConflictError, NotFoundError, ValidationError } from "../src/core/errors";
import { Shelter } from "../src/features/lares/domain/shelter.entity";
import { ShelterStatus, type ShelterStatusValue } from "../src/features/lares/domain/shelter-status.vo";
import { updateShelterSchema } from "../src/features/lares/schema";
import type {
  AnimalNoLar,
  AnimalVinculo,
  IShelterRepository,
  ListSheltersResultado,
} from "../src/features/lares/shelter.repository";
import { UpdateShelterUseCase } from "../src/features/lares/use-cases/update-shelter.use-case";
import { AddAnimalToShelterUseCase } from "../src/features/lares/use-cases/add-animal-to-shelter.use-case";
import { RemoveAnimalFromShelterUseCase } from "../src/features/lares/use-cases/remove-animal-from-shelter.use-case";
import { GetShelterUseCase } from "../src/features/lares/use-cases/get-shelter.use-case";
import { DeleteShelterUseCase } from "../src/features/lares/use-cases/delete-shelter.use-case";
import { UpdateShelterStatusUseCase } from "../src/features/lares/use-cases/update-shelter-status.use-case";

const LAR_ID = "11111111-1111-4111-8111-111111111111";
const OUTRO_LAR_ID = "22222222-2222-4222-8222-222222222222";

interface AnimalFake extends AnimalVinculo {
  nome: string;
  especie: string | null;
  urlFoto: string | null;
}

/** Repository em memória: guarda lares e animais e aplica as escritas de verdade. */
class InMemoryShelterRepository implements IShelterRepository {
  lares = new Map<string, Shelter>();
  animais = new Map<string, AnimalFake>();
  inativados: string[] = [];

  async list(): Promise<ListSheltersResultado> {
    return { items: [], total: 0 };
  }

  async findById(id: string): Promise<Shelter> {
    const lar = this.lares.get(id);
    if (!lar) throw new NotFoundError("Lar temporário");
    return lar;
  }

  async create(): Promise<never> {
    throw new Error("não usado");
  }

  async update(shelter: Shelter): Promise<Shelter> {
    this.lares.set(shelter.id, shelter);
    return shelter;
  }

  async updateStatus(id: string, status: ShelterStatus | ShelterStatusValue): Promise<Shelter> {
    const lar = await this.findById(id);
    const valor = typeof status === "string" ? status : status.valor;
    expect(lar.status.valor).toBe(valor);
    return lar;
  }

  async inativar(id: string): Promise<void> {
    this.inativados.push(id);
  }

  async listAnimais(larId: string): Promise<AnimalNoLar[]> {
    return [...this.animais.values()]
      .filter((a) => a.larTemporarioId === larId)
      .map(({ id, nome, especie, urlFoto }) => ({ id, nome, especie, urlFoto }));
  }

  async contarAnimais(larId: string): Promise<number> {
    return (await this.listAnimais(larId)).length;
  }

  async findAnimal(animalId: string): Promise<AnimalVinculo> {
    const animal = this.animais.get(animalId);
    if (!animal) throw new NotFoundError("Animal");
    return animal;
  }

  async vincularAnimal(larId: string, animalId: string): Promise<void> {
    const animal = await this.findAnimal(animalId);
    this.animais.set(animalId, { ...(animal as AnimalFake), larTemporarioId: larId, status: "em_lar_temporario" });
  }

  async desvincularAnimal(animalId: string): Promise<void> {
    const animal = await this.findAnimal(animalId);
    this.animais.set(animalId, { ...(animal as AnimalFake), larTemporarioId: null, status: "disponivel" });
  }
}

function larFixture(overrides: Partial<Parameters<typeof Shelter.restore>[0]> = {}): Shelter {
  return Shelter.restore({
    id: LAR_ID,
    nomeResponsavel: "Maria Silva",
    contato: "33999990000",
    capacidade: 2,
    status: ShelterStatus.from("disponivel"),
    enderecoRegiao: "Centro",
    aceitaGatos: true,
    aceitaCachorros: true,
    isActive: true,
    createdAt: "2026-10-14T00:00:00.000Z",
    ...overrides,
  });
}

function animalFixture(id: string, overrides: Partial<AnimalFake> = {}): AnimalFake {
  return { id, nome: `Animal ${id}`, especie: "Cachorro", urlFoto: null, status: "disponivel", larTemporarioId: null, ...overrides };
}

let repo: InMemoryShelterRepository;

beforeEach(() => {
  repo = new InMemoryShelterRepository();
  repo.lares.set(LAR_ID, larFixture());
});

describe("ShelterStatus — matriz de transição (KAN-80)", () => {
  const permitidas: [ShelterStatusValue, ShelterStatusValue][] = [
    ["disponivel", "ocupado"],
    ["disponivel", "em_avaliacao"],
    ["disponivel", "inativo"],
    ["ocupado", "disponivel"],
    ["ocupado", "em_avaliacao"],
    ["ocupado", "inativo"],
    ["em_avaliacao", "disponivel"],
    ["em_avaliacao", "ocupado"],
    ["em_avaliacao", "inativo"],
    ["inativo", "em_avaliacao"],
  ];
  const proibidas: [ShelterStatusValue, ShelterStatusValue][] = [
    ["inativo", "disponivel"],
    ["inativo", "ocupado"],
    ["disponivel", "disponivel"],
    ["inativo", "inativo"],
  ];

  it.each(permitidas)("%s -> %s é permitido", (de, para) => {
    expect(ShelterStatus.from(de).podeTransicionarPara(ShelterStatus.from(para))).toBe(true);
  });

  it.each(proibidas)("%s -> %s é proibido", (de, para) => {
    expect(ShelterStatus.from(de).podeTransicionarPara(ShelterStatus.from(para))).toBe(false);
  });
});

describe("UpdateShelterStatusUseCase (KAN-80)", () => {
  it("ocupado volta direto para disponível", async () => {
    repo.lares.set(LAR_ID, larFixture({ status: ShelterStatus.from("ocupado") }));
    const dto = await new UpdateShelterStatusUseCase(repo).execute(LAR_ID, "disponivel");
    expect(dto.status).toBe("disponivel");
    expect(dto.isActive).toBe(true);
  });

  it("inativar um lar vazio marca isActive = false", async () => {
    const dto = await new UpdateShelterStatusUseCase(repo).execute(LAR_ID, "inativo");
    expect(dto.status).toBe("inativo");
    expect(dto.isActive).toBe(false);
  });

  it("não inativa lar com animais (422)", async () => {
    repo.animais.set("a1", animalFixture("a1", { larTemporarioId: LAR_ID }));
    await expect(new UpdateShelterStatusUseCase(repo).execute(LAR_ID, "inativo")).rejects.toBeInstanceOf(
      BusinessRuleError,
    );
  });

  it("transição proibida devolve 400", async () => {
    repo.lares.set(LAR_ID, larFixture({ status: ShelterStatus.from("inativo"), isActive: false }));
    await expect(new UpdateShelterStatusUseCase(repo).execute(LAR_ID, "disponivel")).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("reativar (inativo -> em avaliação) volta isActive = true", async () => {
    repo.lares.set(LAR_ID, larFixture({ status: ShelterStatus.from("inativo"), isActive: false }));
    const dto = await new UpdateShelterStatusUseCase(repo).execute(LAR_ID, "em_avaliacao");
    expect(dto.isActive).toBe(true);
  });
});

describe("DeleteShelterUseCase (KAN-80)", () => {
  it("inativa em vez de apagar", async () => {
    await new DeleteShelterUseCase(repo).execute(LAR_ID);
    expect(repo.inativados).toEqual([LAR_ID]);
    expect(repo.lares.has(LAR_ID)).toBe(true);
  });

  it("lar com animais não é removido (422)", async () => {
    repo.animais.set("a1", animalFixture("a1", { larTemporarioId: LAR_ID }));
    await expect(new DeleteShelterUseCase(repo).execute(LAR_ID)).rejects.toBeInstanceOf(BusinessRuleError);
    expect(repo.inativados).toEqual([]);
  });

  it("lar que não existe devolve 404", async () => {
    await expect(new DeleteShelterUseCase(repo).execute(OUTRO_LAR_ID)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("UpdateShelterUseCase (KAN-77)", () => {
  it("edita só os campos enviados", async () => {
    const dto = await new UpdateShelterUseCase(repo).execute(LAR_ID, { contato: "33988887777", aceitaGatos: false });
    expect(dto.contato).toBe("33988887777");
    expect(dto.aceitaGatos).toBe(false);
    expect(dto.nomeResponsavel).toBe("Maria Silva");
    expect(dto.aceitaCachorros).toBe(true);
  });

  it("id que não existe devolve 404", async () => {
    await expect(new UpdateShelterUseCase(repo).execute(OUTRO_LAR_ID, { contato: "x" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("capacidade menor que a ocupação devolve 422 com mensagem clara", async () => {
    repo.animais.set("a1", animalFixture("a1", { larTemporarioId: LAR_ID }));
    repo.animais.set("a2", animalFixture("a2", { larTemporarioId: LAR_ID }));

    const promessa = new UpdateShelterUseCase(repo).execute(LAR_ID, { capacidade: 1 });
    await expect(promessa).rejects.toBeInstanceOf(BusinessRuleError);
    await expect(promessa).rejects.toThrow("o lar tem 2 animal(is)");
  });

  it("capacidade igual à ocupação é aceita", async () => {
    repo.animais.set("a1", animalFixture("a1", { larTemporarioId: LAR_ID }));
    const dto = await new UpdateShelterUseCase(repo).execute(LAR_ID, { capacidade: 1 });
    expect(dto.capacidade).toBe(1);
  });
});

describe("updateShelterSchema (KAN-77)", () => {
  it("corpo vazio é inválido (400)", () => {
    expect(updateShelterSchema.safeParse({}).success).toBe(false);
  });

  it("capacidade zero é inválida (400)", () => {
    expect(updateShelterSchema.safeParse({ capacidade: 0 }).success).toBe(false);
  });

  it("campo desconhecido (ex.: status) é recusado — status muda pelo PATCH", () => {
    expect(updateShelterSchema.safeParse({ status: "inativo" }).success).toBe(false);
  });

  it("aceita edição parcial", () => {
    expect(updateShelterSchema.parse({ enderecoRegiao: "  Vila Isa  " })).toEqual({ enderecoRegiao: "Vila Isa" });
  });
});

describe("AddAnimalToShelterUseCase (KAN-78)", () => {
  it("coloca o animal no lar: status vira em_lar_temporario e as vagas diminuem", async () => {
    repo.animais.set("a1", animalFixture("a1"));

    const dto = await new AddAnimalToShelterUseCase(repo).execute(LAR_ID, "a1");

    expect(repo.animais.get("a1")).toMatchObject({ larTemporarioId: LAR_ID, status: "em_lar_temporario" });
    expect(dto.ocupacao).toBe(1);
    expect(dto.vagas).toBe(1);
    expect(dto.animais.map((a) => a.id)).toEqual(["a1"]);
  });

  it("recusa lar inativo (422)", async () => {
    repo.lares.set(LAR_ID, larFixture({ status: ShelterStatus.from("inativo"), isActive: false }));
    repo.animais.set("a1", animalFixture("a1"));
    await expect(new AddAnimalToShelterUseCase(repo).execute(LAR_ID, "a1")).rejects.toBeInstanceOf(
      BusinessRuleError,
    );
  });

  it("recusa lar cheio (422)", async () => {
    repo.animais.set("a1", animalFixture("a1", { larTemporarioId: LAR_ID }));
    repo.animais.set("a2", animalFixture("a2", { larTemporarioId: LAR_ID }));
    repo.animais.set("a3", animalFixture("a3"));
    await expect(new AddAnimalToShelterUseCase(repo).execute(LAR_ID, "a3")).rejects.toThrow("O lar está cheio");
    expect(repo.animais.get("a3")?.larTemporarioId).toBeNull();
  });

  it("recusa animal adotado (422)", async () => {
    repo.animais.set("a1", animalFixture("a1", { status: "adotado" }));
    await expect(new AddAnimalToShelterUseCase(repo).execute(LAR_ID, "a1")).rejects.toBeInstanceOf(
      BusinessRuleError,
    );
  });

  it("recusa animal que já está em outro lar (409)", async () => {
    repo.animais.set("a1", animalFixture("a1", { larTemporarioId: OUTRO_LAR_ID, status: "em_lar_temporario" }));
    await expect(new AddAnimalToShelterUseCase(repo).execute(LAR_ID, "a1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("animal que não existe devolve 404", async () => {
    await expect(new AddAnimalToShelterUseCase(repo).execute(LAR_ID, "nao-existe")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("RemoveAnimalFromShelterUseCase (KAN-78)", () => {
  it("tira o animal: status volta para disponivel e a vaga volta", async () => {
    repo.animais.set("a1", animalFixture("a1", { larTemporarioId: LAR_ID, status: "em_lar_temporario" }));

    const dto = await new RemoveAnimalFromShelterUseCase(repo).execute(LAR_ID, "a1");

    expect(repo.animais.get("a1")).toMatchObject({ larTemporarioId: null, status: "disponivel" });
    expect(dto.ocupacao).toBe(0);
    expect(dto.vagas).toBe(2);
    expect(dto.animais).toEqual([]);
  });

  it("animal que não está neste lar devolve 404 e não mexe nele", async () => {
    repo.animais.set("a1", animalFixture("a1", { larTemporarioId: OUTRO_LAR_ID, status: "em_lar_temporario" }));
    await expect(new RemoveAnimalFromShelterUseCase(repo).execute(LAR_ID, "a1")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repo.animais.get("a1")?.larTemporarioId).toBe(OUTRO_LAR_ID);
  });
});

describe("GetShelterUseCase (KAN-79)", () => {
  it("formato exato da resposta, com animais do lar", async () => {
    repo.animais.set("a1", animalFixture("a1", { larTemporarioId: LAR_ID, nome: "Thor", urlFoto: "https://x/thor.jpg" }));
    repo.animais.set("a2", animalFixture("a2", { larTemporarioId: OUTRO_LAR_ID }));

    const dto = await new GetShelterUseCase(repo).execute(LAR_ID);

    expect(dto).toEqual({
      id: LAR_ID,
      nomeResponsavel: "Maria Silva",
      contato: "33999990000",
      capacidade: 2,
      status: "disponivel",
      enderecoRegiao: "Centro",
      aceitaGatos: true,
      aceitaCachorros: true,
      isActive: true,
      createdAt: "2026-10-14T00:00:00.000Z",
      ocupacao: 1,
      vagas: 1,
      animais: [{ id: "a1", nome: "Thor", especie: "Cachorro", urlFoto: "https://x/thor.jpg" }],
    });
  });

  it("lar sem animais devolve animais: [] (nunca null)", async () => {
    const dto = await new GetShelterUseCase(repo).execute(LAR_ID);
    expect(dto.animais).toEqual([]);
    expect(dto.ocupacao).toBe(0);
    expect(dto.vagas).toBe(2);
  });
});
