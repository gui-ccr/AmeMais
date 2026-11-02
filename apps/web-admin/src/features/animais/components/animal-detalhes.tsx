import { formatISODateToBR } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { ESPECIE_INFO, FAIXA_ETARIA_INFO, PORTE_INFO, STATUS_INFO } from "../opcoes";
import type { Animal } from "../types";

function Item({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm font-medium text-muted-dark">{rotulo}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}

/** Todos os dados do animal, só para leitura (o conteúdo do modal de detalhes). */
export function AnimalDetalhes({ animal }: { animal: Animal }) {
  const status = STATUS_INFO[animal.status];

  return (
    <div className="flex flex-col gap-4">
      {animal.urlFoto && (
        // Foto vinda do Storage do Supabase: sem domínio fixo para o next/image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={animal.urlFoto}
          alt={`Foto de ${animal.nome}`}
          className="aspect-4/3 w-full rounded-xl object-cover"
        />
      )}

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Item rotulo="Espécie">{ESPECIE_INFO[animal.especie].rotulo}</Item>
        <Item rotulo="Raça">{animal.raca || "Não informada"}</Item>
        <Item rotulo="Porte">{PORTE_INFO[animal.porte].rotulo}</Item>
        <Item rotulo="Faixa etária">{FAIXA_ETARIA_INFO[animal.faixaEtaria].rotulo}</Item>
        <Item rotulo="Idade">{animal.idadeTexto || "Não informada"}</Item>
        <Item rotulo="Status">
          <Badge variant={status.variante} size="sm" dot>
            {status.rotulo}
          </Badge>
        </Item>
        <div className="sm:col-span-2">
          <Item rotulo="Descrição">
            {animal.descricao ? (
              <span className="whitespace-pre-line break-words">{animal.descricao}</span>
            ) : (
              "Sem descrição"
            )}
          </Item>
        </div>
        {animal.adotante && (
          <div className="sm:col-span-2">
            <Item rotulo="Adoção">
              {animal.adotante.nome}, {animal.adotante.idade} anos — {animal.adotante.localidade}
              {animal.dataAdocao && ` · ${formatISODateToBR(animal.dataAdocao)}`}
            </Item>
          </div>
        )}
      </dl>
    </div>
  );
}
