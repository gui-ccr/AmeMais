import { InternalError, ValidationError } from "@/core/errors";
import type { UploadedImage } from "@/features/uploads/upload-image.use-case";
import { Animal } from "../domain/animal.entity";
import type { IAnimalRepository } from "../animal.repository";
import { toAnimalDTO, type AnimalDTO } from "../animal.dto";
import type { CreateAnimalDTO } from "../schema";

/** Como a foto vai e volta do Storage — injetado pelo controller (Dependency Inversion). */
export interface FotosDoAnimal {
  /** Valida a imagem (tamanho e tipo real) e a envia; lança ValidationError se não servir. */
  enviar(bytes: Uint8Array): Promise<UploadedImage>;
  /** Apaga uma foto enviada. */
  remover(path: string): Promise<void>;
}

/**
 * Cadastra um animal, opcionalmente com a foto no mesmo pedido.
 *
 * A foto só existe no Storage se o animal for gravado. A ordem garante isso:
 *  1. valida o animal (regras de domínio) — se for inválido, nada é enviado;
 *  2. valida e envia a foto — se a imagem não servir, nada é gravado;
 *  3. grava o animal com a URL da foto;
 *  4. se a gravação FALHAR, apaga a foto que acabou de subir e repassa o erro.
 * Sobra a foto apenas se a própria remoção também falhar (o erro é logado).
 */
export class CreateAnimalUseCase {
  constructor(
    private readonly repository: IAnimalRepository,
    private readonly fotos?: FotosDoAnimal,
  ) {}

  async execute(input: CreateAnimalDTO, foto?: Uint8Array): Promise<AnimalDTO> {
    if (foto && input.urlFoto) {
      throw new ValidationError("envie a foto como arquivo OU como urlFoto, não os dois");
    }
    if (foto && !this.fotos) {
      throw new InternalError("upload de foto não configurado");
    }

    // Valida as invariantes de domínio (ex.: status inicial permitido, dados
    // da adoção) e devolve os dados já normalizados — é esse resultado, não o
    // input cru, que é persistido. Antes de tocar no Storage.
    const data = Animal.create(input);

    // O animal já adotado é registrado com foto (arquivo ou URL). Confere antes
    // de enviar qualquer coisa ao Storage.
    if (data.status.valor === "adotado" && !foto && !input.urlFoto?.trim()) {
      throw new ValidationError("foto é obrigatória para cadastrar um animal já adotado");
    }

    let imagem: UploadedImage | undefined;
    if (foto && this.fotos) {
      imagem = await this.fotos.enviar(foto);
      data.urlFoto = imagem.url;
    }

    try {
      const animal = await this.repository.create(data);
      return toAnimalDTO(animal);
    } catch (error) {
      if (imagem && this.fotos) {
        await this.fotos.remover(imagem.path).catch((falha) => {
          console.error(`Foto órfã no Storage (falha ao remover ${imagem.path})`, falha);
        });
      }
      throw error;
    }
  }
}
