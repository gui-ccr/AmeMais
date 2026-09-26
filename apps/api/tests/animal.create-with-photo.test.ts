import { beforeEach, describe, expect, it, vi } from "vitest";
import { Animal } from "../src/features/animals/domain/animal.entity";
import type { IAnimalRepository } from "../src/features/animals/animal.repository";
import {
  CreateAnimalUseCase,
  type FotosDoAnimal,
} from "../src/features/animals/use-cases/create-animal.use-case";
import { updateAnimalStatusSchema } from "../src/features/animals/schema";
import { DatabaseError, ValidationError } from "../src/core/errors";

const ADOTANTE = { nome: "Maria Souza", idade: 34, cep: "39800000", localidade: "Teófilo Otoni - MG" };
const FOTO = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);
const HOJE = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

/** Animal adotado válido, para os testes onde o foco é a foto. */
const ANIMAL_ADOTADO = {
  nome: "Thor",
  especie: "Cachorro" as const,
  raca: "SRD",
  status: "adotado" as const,
  adotante: ADOTANTE,
  dataAdocao: HOJE,
};

describe("CreateAnimalUseCase — a foto só fica no Storage se o animal for gravado", () => {
  let repository: { create: ReturnType<typeof vi.fn> };
  let fotos: { enviar: ReturnType<typeof vi.fn>; remover: ReturnType<typeof vi.fn> };
  let useCase: CreateAnimalUseCase;

  beforeEach(() => {
    repository = {
      create: vi.fn(async (data) => Animal.restore({ id: "novo", createdAt: "2026-09-25T15:00:00Z", ...data })),
    };
    fotos = {
      enviar: vi.fn(async () => ({ url: "https://storage/animais/x.jpg", path: "animais/x.jpg" })),
      remover: vi.fn(async () => undefined),
    };
    useCase = new CreateAnimalUseCase(
      repository as unknown as IAnimalRepository,
      fotos as unknown as FotosDoAnimal,
    );
  });

  it("caminho feliz: envia a foto, grava o animal com a URL e não apaga nada", async () => {
    const dto = await useCase.execute(ANIMAL_ADOTADO, FOTO);

    expect(fotos.enviar).toHaveBeenCalledWith(FOTO);
    expect(repository.create.mock.calls[0]![0].urlFoto).toBe("https://storage/animais/x.jpg");
    expect(dto.urlFoto).toBe("https://storage/animais/x.jpg");
    expect(fotos.remover).not.toHaveBeenCalled();
  });

  it("animal inválido: NADA é enviado ao Storage", async () => {
    await expect(useCase.execute({ ...ANIMAL_ADOTADO, adotante: undefined }, FOTO)).rejects.toThrow(ValidationError);

    expect(fotos.enviar).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("imagem inválida: o animal NÃO é gravado", async () => {
    fotos.enviar.mockRejectedValueOnce(new ValidationError("a imagem deve ser jpeg, png, webp"));

    await expect(useCase.execute(ANIMAL_ADOTADO, FOTO)).rejects.toThrow(/imagem/);

    expect(repository.create).not.toHaveBeenCalled();
    expect(fotos.remover).not.toHaveBeenCalled();
  });

  it("gravação falhou: a foto que acabou de subir é APAGADA e o erro original é repassado", async () => {
    const erro = new DatabaseError({ code: "23514" });
    repository.create.mockRejectedValueOnce(erro);

    await expect(useCase.execute(ANIMAL_ADOTADO, FOTO)).rejects.toBe(erro);

    expect(fotos.remover).toHaveBeenCalledWith("animais/x.jpg");
  });

  it("se a limpeza também falhar, o erro original ainda é o que chega ao usuário", async () => {
    const erro = new DatabaseError();
    repository.create.mockRejectedValueOnce(erro);
    fotos.remover.mockRejectedValueOnce(new Error("storage fora do ar"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(useCase.execute(ANIMAL_ADOTADO, FOTO)).rejects.toBe(erro);

    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("sem foto: não mexe no Storage (cadastro só com dados, ou com urlFoto já pronta)", async () => {
    await useCase.execute({ ...ANIMAL_ADOTADO, urlFoto: "https://exemplo.com/foto.jpg" });

    expect(fotos.enviar).not.toHaveBeenCalled();
    expect(repository.create.mock.calls[0]![0].urlFoto).toBe("https://exemplo.com/foto.jpg");
  });

  it("animal adotado sem foto (nem arquivo, nem urlFoto) é recusado antes de qualquer envio", async () => {
    await expect(useCase.execute(ANIMAL_ADOTADO)).rejects.toThrow(/foto é obrigatória/);

    expect(fotos.enviar).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("recusa foto e urlFoto ao mesmo tempo", async () => {
    await expect(
      useCase.execute({ ...ANIMAL_ADOTADO, urlFoto: "https://exemplo.com/foto.jpg" }, FOTO),
    ).rejects.toThrow(ValidationError);

    expect(fotos.enviar).not.toHaveBeenCalled();
  });
});

describe("updateAnimalStatusSchema", () => {
  it("aceita o status sozinho e o status com os dados da adoção", () => {
    expect(() => updateAnimalStatusSchema.parse({ status: "disponivel" })).not.toThrow();

    const parsed = updateAnimalStatusSchema.parse({ status: "adotado", adotante: ADOTANTE, dataAdocao: "2026-09-20" });
    expect(parsed.adotante?.nome).toBe("Maria Souza");
  });

  it("rejeita data em formato errado", () => {
    expect(() => updateAnimalStatusSchema.parse({ status: "adotado", dataAdocao: "20/09/2026" })).toThrow();
  });
});
