import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AnimalRepository } from "../src/features/animals/animal.repository";
import { Adotante } from "../src/features/animals/domain/adotante.vo";
import { Animal } from "../src/features/animals/domain/animal.entity";
import { AnimalStatus } from "../src/features/animals/domain/animal-status.vo";
import type { AnimalRow } from "../src/features/animals/mapper";

type Call = { method: string; args: unknown[] };

/**
 * Dublê mínimo do query builder encadeável do supabase-js (`.from().update()
 * .eq().select().single()` etc.), registrando cada chamada. Não existe teste
 * de repository no projeto ainda usando um Supabase real — isso é o jeito
 * mais direto de provar o payload exato que iria pro Postgres, sem precisar
 * de acesso a um banco de verdade.
 */
function stubSupabase(finalResult: { data: unknown; error: unknown }) {
  const calls: Call[] = [];
  const chain = {
    from: (...args: unknown[]) => {
      calls.push({ method: "from", args });
      return chain;
    },
    insert: (...args: unknown[]) => {
      calls.push({ method: "insert", args });
      return chain;
    },
    update: (...args: unknown[]) => {
      calls.push({ method: "update", args });
      return chain;
    },
    select: (...args: unknown[]) => {
      calls.push({ method: "select", args });
      return chain;
    },
    eq: (...args: unknown[]) => {
      calls.push({ method: "eq", args });
      return chain;
    },
    single: async () => finalResult,
  };
  return { client: chain as unknown as SupabaseClient, calls };
}

function rowFixture(overrides: Partial<AnimalRow> = {}): AnimalRow {
  return {
    id: "animal-1",
    nome: "Rex",
    especie: "Cachorro",
    raca: "Labrador",
    status_adocao: "disponivel",
    lar_temporario_id: null,
    adotante_id: null,
    adotante_nome: null,
    adotante_idade: null,
    adotante_cep: null,
    adotante_localidade: null,
    url_foto: null, porte: "M", faixa_etaria: "adulto", idade_texto: null, descricao: null,
    data_adocao: null,
    created_at: "2026-09-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("AnimalRepository", () => {
  describe("create()", () => {
    it("deve inserir os campos do adotante e dataAdocao vindos de mapCreateDTOToRow", async () => {
      const row = rowFixture({
        status_adocao: "adotado",
        adotante_nome: "João Silva",
        adotante_idade: 30,
        adotante_cep: "39800000",
        adotante_localidade: "Teófilo Otoni",
        data_adocao: "2026-09-20",
      });
      const { client, calls } = stubSupabase({ data: row, error: null });
      const repository = new AnimalRepository(client);

      const animal = await repository.create(
        Animal.create({
          nome: "Rex",
          especie: "Cachorro",
          raca: "Labrador",
          status: "adotado",
          adotante: { nome: "João Silva", idade: 30, cep: "39800000", localidade: "Teófilo Otoni" },
          dataAdocao: "2026-09-20",
        }),
      );

      const insertCall = calls.find((c) => c.method === "insert");
      expect(insertCall?.args[0]).toEqual({
        nome: "Rex",
        especie: "Cachorro",
        raca: "Labrador",
        status_adocao: "adotado",
        porte: "M",
        faixa_etaria: "adulto",
        idade_texto: null,
        descricao: null,
        url_foto: null,
        adotante_nome: "João Silva",
        adotante_idade: 30,
        adotante_cep: "39800000",
        adotante_localidade: "Teófilo Otoni",
        data_adocao: "2026-09-20",
      });
      expect(animal.adotante).toEqual({
        nome: "João Silva",
        idade: 30,
        cep: "39800000",
        localidade: "Teófilo Otoni",
      });
    });
  });

  describe("updateStatus()", () => {
    it("deve gravar adotante_* e data_adocao como null no Supabase quando o animal deixa de estar adotado", async () => {
      const animal = Animal.restore({
        id: "animal-1",
        nome: "Rex",
        especie: "Cachorro",
        raca: "Labrador",
        status: AnimalStatus.from("adotado"),
        urlFoto: "https://exemplo.com/rex.png", porte: "M", faixaEtaria: "adulto", idadeTexto: null, descricao: null,
        larTemporarioId: null,
        adotanteId: null,
        adotante: Adotante.from({ nome: "João Silva", idade: 30, cep: "39800000", localidade: "Teófilo Otoni" }),
        dataAdocao: "2026-09-20",
        createdAt: "2026-09-20T00:00:00.000Z",
      });

      // Devolução: sai de "adotado" -> a própria entidade já limpa os dados em memória.
      animal.changeStatus(AnimalStatus.from("disponivel"));
      expect(animal.adotante).toBeNull();
      expect(animal.dataAdocao).toBeNull();

      const row = rowFixture({ status_adocao: "disponivel" });
      const { client, calls } = stubSupabase({ data: row, error: null });
      const repository = new AnimalRepository(client);

      await repository.updateStatus(animal);

      const updateCall = calls.find((c) => c.method === "update");
      expect(updateCall?.args[0]).toEqual({
        status_adocao: "disponivel",
        adotante_id: null,
        adotante_nome: null,
        adotante_idade: null,
        adotante_cep: null,
        adotante_localidade: null,
        data_adocao: null,
      });
    });

    it("deve gravar os dados do adotante quando o animal passa a ser adotado", async () => {
      const animal = Animal.restore({
        id: "animal-2",
        nome: "Bidu",
        especie: "Cachorro",
        raca: "SRD",
        status: AnimalStatus.from("disponivel"),
        urlFoto: "https://exemplo.com/bidu.png", porte: "M", faixaEtaria: "adulto", idadeTexto: null, descricao: null,
        larTemporarioId: null,
        adotanteId: null,
        adotante: null,
        dataAdocao: null,
        createdAt: "2026-09-20T00:00:00.000Z",
      });

      // Simula o status já ganhando o retrato do adotante (fluxo do use case: entidade
      // completa é reconstruída em memória com os dados antes de chamar o repository).
      const comAdotante = Animal.restore({
        id: animal.id,
        nome: animal.nome,
        especie: animal.especie,
        raca: animal.raca,
        status: AnimalStatus.from("adotado"),
        urlFoto: animal.urlFoto, porte: "M", faixaEtaria: "adulto", idadeTexto: null, descricao: null,
        larTemporarioId: animal.larTemporarioId,
        adotanteId: animal.adotanteId,
        adotante: Adotante.from({ nome: "Maria Souza", idade: 40, cep: "39800000", localidade: "Teófilo Otoni" }),
        dataAdocao: "2026-09-20",
        createdAt: animal.createdAt,
      });

      const row = rowFixture({ status_adocao: "adotado" });
      const { client, calls } = stubSupabase({ data: row, error: null });
      const repository = new AnimalRepository(client);

      await repository.updateStatus(comAdotante);

      const updateCall = calls.find((c) => c.method === "update");
      expect(updateCall?.args[0]).toEqual({
        status_adocao: "adotado",
        adotante_id: null,
        adotante_nome: "Maria Souza",
        adotante_idade: 40,
        adotante_cep: "39800000",
        adotante_localidade: "Teófilo Otoni",
        data_adocao: "2026-09-20",
      });
    });
  });
});
