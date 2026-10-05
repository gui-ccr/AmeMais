import { api } from "@/lib/axios";
import { formatCEP } from "@/utils";
import {
  ESPECIES,
  type Adocao,
  type AlterarStatusInput,
  type Animal,
  type AnimalDTO,
  type Especie,
  type NovoAnimalInput,
} from "../types";

/** Dados da adoção no formato da API: o CEP vai só com os 8 dígitos. */
function paraCorpoDaAdocao({ adotante, dataAdocao }: Adocao) {
  return {
    adotante: { ...adotante, cep: adotante.cep.replace(/\D/g, "") },
    dataAdocao,
  };
}

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
   * Cadastra um animal resgatado, no status escolhido. Os dados da adoção só vão
   * junto quando o animal já nasce `adotado` (a API recusa nos outros status).
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
        status: input.status,
        ...(input.adocao ? paraCorpoDaAdocao(input.adocao) : {}),
      }),
    );
    corpo.append("foto", input.foto);

    const { data } = await api.post<{ data: AnimalDTO }>("/api/animals", corpo);
    return paraAnimal(data.data);
  },

  /**
   * Troca o status do animal. É um `PATCH` (a API não tem `PUT`: o status é a única
   * coisa que se altera depois do cadastro). Ao passar para `adotado` os dados da
   * adoção são obrigatórios; ao sair de `adotado` a API apaga os dados do adotante.
   */
  async updateStatus(id: string, input: AlterarStatusInput): Promise<Animal> {
    const { data } = await api.patch<{ data: AnimalDTO }>(`/api/animals/${id}`, {
      status: input.status,
      ...(input.adocao ? paraCorpoDaAdocao(input.adocao) : {}),
    });
    return paraAnimal(data.data);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/animals/${id}`);
  },
};
