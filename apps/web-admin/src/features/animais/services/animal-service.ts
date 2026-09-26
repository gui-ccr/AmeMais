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

/** Envia a foto e devolve a URL pública que o cadastro do animal guarda em `urlFoto`. */
async function enviarFoto(foto: File): Promise<string> {
  const corpo = new FormData();
  corpo.append("file", foto);
  corpo.append("tipo", "animal");

  const { data } = await api.post<{ data: { url: string } }>("/api/uploads/imagem", corpo);
  return data.data.url;
}

export const animalService = {
  async list(): Promise<Animal[]> {
    const { data } = await api.get<{ data: AnimalDTO[] }>("/api/animals");
    return data.data.map(paraAnimal);
  },

  /**
   * Cadastra um animal JÁ ADOTADO (o formulário registra a adoção junto): envia
   * a foto e depois cria o animal com os dados do adotante. Se o cadastro falhar
   * depois do envio, a foto fica no bucket sem animal — inofensivo, e o nome
   * aleatório evita colisão numa nova tentativa.
   */
  async create(input: NovoAnimalInput): Promise<Animal> {
    const urlFoto = await enviarFoto(input.foto);

    const { data } = await api.post<{ data: AnimalDTO }>("/api/animals", {
      nome: input.nome,
      especie: input.especie,
      raca: input.raca,
      urlFoto,
      status: "adotado",
      adotante: {
        nome: input.adotante.nome,
        idade: input.adotante.idade,
        cep: input.adotante.cep.replace(/\D/g, ""),
        localidade: input.adotante.localidade,
      },
      dataAdocao: input.dataAdocao,
    });
    return paraAnimal(data.data);
  },
};
