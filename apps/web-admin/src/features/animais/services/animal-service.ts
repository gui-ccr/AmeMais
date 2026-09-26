import { api } from "@/lib/axios";
import { formatCEP } from "@/utils";
import { ESPECIES, type Animal, type AnimalDTO, type Especie, type NovoAnimalInput } from "../types";

/** Animais antigos podem ter espécie fora da lista (ou vazia): caem em "Outro". */
function paraEspecie(valor: string | null): Especie {
  return ESPECIES.find((especie) => especie === valor) ?? "Outro";
}

/** Do formato da API para o modelo usado nas telas. */
export function paraAnimal(dto: AnimalDTO): Animal {
  return {
    id: dto.id,
    nome: dto.nome,
    especie: paraEspecie(dto.especie),
    raca: dto.raca ?? "",
    status: dto.status,
    urlFoto: dto.urlFoto,
    adotante: dto.adotante ? { ...dto.adotante, cep: formatCEP(dto.adotante.cep) } : null,
    dataAdocao: dto.dataAdocao,
    createdAt: dto.createdAt,
  };
}

export const animalService = {
  async list(): Promise<Animal[]> {
    const { data } = await api.get<{ data: AnimalDTO[] }>("/api/animals");
    return data.data.map(paraAnimal);
  },

  /**
   * Cadastra um animal JÁ ADOTADO (o formulário registra a adoção junto).
   *
   * É UM pedido só (multipart): `dados` com o JSON do animal e `foto` com o
   * arquivo. A API valida tudo, sobe a foto e grava o animal — e se a gravação
   * falhar, apaga a foto. Assim uma foto nunca fica no bucket sem animal, que
   * era o risco de enviar a foto num pedido e cadastrar o animal em outro.
   */
  async create(input: NovoAnimalInput): Promise<Animal> {
    const corpo = new FormData();
    corpo.append(
      "dados",
      JSON.stringify({
        nome: input.nome,
        especie: input.especie,
        raca: input.raca,
        status: "adotado",
        adotante: {
          nome: input.adotante.nome,
          idade: input.adotante.idade,
          cep: input.adotante.cep.replace(/\D/g, ""),
          localidade: input.adotante.localidade,
        },
        dataAdocao: input.dataAdocao,
      }),
    );
    corpo.append("foto", input.foto);

    const { data } = await api.post<{ data: AnimalDTO }>("/api/animals", corpo);
    return paraAnimal(data.data);
  },
};
