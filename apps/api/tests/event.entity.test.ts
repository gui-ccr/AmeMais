import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Event } from "../src/features/events/domain/event.entity";
import { EventDate } from "../src/features/events/domain/event-date.vo";
import { ValidationError } from "../src/core/errors";

/** Relógio fixo: 25/09/2026 às 12h em Brasília (15h UTC). */
const AGORA = new Date("2026-09-25T15:00:00.000Z");

function eventoPublicado(dataEvento: string) {
  return Event.restore({
    id: "e1",
    titulo: "Feira de adoção",
    descricao: null,
    dataEvento: EventDate.from(dataEvento),
    isActive: true,
    createdAt: "2026-09-01T00:00:00.000Z",
  });
}

describe("EventDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AGORA);
  });
  afterEach(() => vi.useRealTimers());

  it("extrai o dia de 'AAAA-MM-DD' e do ISO completo devolvido pelo Postgres", () => {
    expect(EventDate.from("2026-09-25").dia).toBe("2026-09-25");
    expect(EventDate.from("2026-09-25T00:00:00+00:00").dia).toBe("2026-09-25");
  });

  it("evento de hoje NÃO está no passado", () => {
    expect(EventDate.from("2026-09-25").estaNoPassado()).toBe(false);
    expect(EventDate.from("2026-09-25T00:00:00+00:00").estaNoPassado()).toBe(false);
  });

  it("evento de ontem está no passado; o de amanhã não", () => {
    expect(EventDate.from("2026-09-24").estaNoPassado()).toBe(true);
    expect(EventDate.from("2026-09-26").estaNoPassado()).toBe(false);
  });

  it("às 23h30 em Brasília (já 26/09 em UTC) o evento de 26/09 continua sendo futuro", () => {
    vi.setSystemTime(new Date("2026-09-26T02:30:00.000Z"));

    expect(EventDate.from("2026-09-26").estaNoPassado()).toBe(false);
    expect(EventDate.from("2026-09-25").estaNoPassado()).toBe(false);
    expect(EventDate.from("2026-09-24").estaNoPassado()).toBe(true);
  });

  it("mesmoDiaQue ignora o formato (data simples vs ISO completo)", () => {
    expect(EventDate.from("2026-09-25").mesmoDiaQue(EventDate.from("2026-09-25T00:00:00+00:00"))).toBe(true);
    expect(EventDate.from("2026-09-25").mesmoDiaQue(EventDate.from("2026-09-26"))).toBe(false);
  });
});

describe("Event (regra de publicação)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AGORA);
  });
  afterEach(() => vi.useRealTimers());

  describe("create()", () => {
    it("permite publicar um evento que acontece hoje", () => {
      const evento = Event.create({ titulo: "Feira", dataEvento: "2026-09-25", isActive: true });
      expect(evento.isActive).toBe(true);
    });

    it("permite publicar um evento futuro", () => {
      expect(() => Event.create({ titulo: "Feira", dataEvento: "2026-10-10", isActive: true })).not.toThrow();
    });

    it("bloqueia publicar com data no passado", () => {
      expect(() => Event.create({ titulo: "Feira", dataEvento: "2026-09-24", isActive: true })).toThrow(
        ValidationError,
      );
    });

    it("bloqueia publicar sem data", () => {
      expect(() => Event.create({ titulo: "Feira", isActive: true })).toThrow(ValidationError);
    });

    it("permite rascunho com data no passado ou sem data", () => {
      expect(() => Event.create({ titulo: "Feira", dataEvento: "2026-01-01", isActive: false })).not.toThrow();
      expect(() => Event.create({ titulo: "Feira" })).not.toThrow();
    });
  });

  describe("update()", () => {
    it("permite corrigir o título de um evento publicado cujo dia já chegou", () => {
      const evento = eventoPublicado("2026-09-25T00:00:00+00:00");

      expect(() =>
        evento.update({ titulo: "Feira de adoção (novo local)", dataEvento: "2026-09-25", isActive: true }),
      ).not.toThrow();
      expect(evento.titulo).toBe("Feira de adoção (novo local)");
    });

    it("permite editar um evento publicado que já passou, mantendo o mesmo dia", () => {
      const evento = eventoPublicado("2026-09-20T00:00:00+00:00");

      expect(() => evento.update({ descricao: "Foi um sucesso!", isActive: true })).not.toThrow();
    });

    it("bloqueia mover um evento publicado para uma data no passado", () => {
      const evento = eventoPublicado("2026-10-10T00:00:00+00:00");

      expect(() => evento.update({ dataEvento: "2026-09-01" })).toThrow(ValidationError);
    });

    it("bloqueia remover a data de um evento publicado", () => {
      const evento = eventoPublicado("2026-10-10T00:00:00+00:00");

      expect(() => evento.update({ dataEvento: null })).toThrow(ValidationError);
    });

    it("bloqueia publicar um rascunho cuja data já passou", () => {
      const evento = Event.restore({
        id: "e2",
        titulo: "Rascunho antigo",
        descricao: null,
        dataEvento: EventDate.from("2026-09-01T00:00:00+00:00"),
        isActive: false,
        createdAt: "2026-08-01T00:00:00.000Z",
      });

      expect(() => evento.update({ isActive: true })).toThrow(ValidationError);
    });

    it("permite despublicar um evento a qualquer momento", () => {
      const evento = eventoPublicado("2026-09-20T00:00:00+00:00");

      expect(() => evento.update({ isActive: false })).not.toThrow();
      expect(evento.isActive).toBe(false);
    });
  });
});
