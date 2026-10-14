import { describe, expect, it } from "vitest";
import { TipoVoluntario } from "../src/features/voluntarios/domain/tipo-voluntario.vo";
import { AreaDeAjuda } from "../src/features/voluntarios/domain/area-de-ajuda.vo";
import { StatusVoluntario } from "../src/features/voluntarios/domain/status-voluntario.vo";
import { ValidationError } from "../src/core/errors";

describe("TipoVoluntario", () => {
  it("aceita 'veterinario'", () => {
    expect(TipoVoluntario.from("veterinario").valor).toBe("veterinario");
  });

  it("aceita 'apoio_geral'", () => {
    expect(TipoVoluntario.from("apoio_geral").valor).toBe("apoio_geral");
  });

  it("rejeita valores desconhecidos", () => {
    expect(() => TipoVoluntario.from("coordenador")).toThrowError(ValidationError);
    expect(() => TipoVoluntario.from("")).toThrowError(ValidationError);
  });

  it("duas instâncias com o mesmo valor são iguais (Value Object)", () => {
    expect(TipoVoluntario.from("veterinario").equals(TipoVoluntario.from("veterinario"))).toBe(true);
    expect(TipoVoluntario.from("veterinario").equals(TipoVoluntario.from("apoio_geral"))).toBe(false);
  });
});

describe("AreaDeAjuda", () => {
  it("aceita 'lar_temporario'", () => {
    expect(AreaDeAjuda.from("lar_temporario").valor).toBe("lar_temporario");
  });

  it("aceita 'transporte'", () => {
    expect(AreaDeAjuda.from("transporte").valor).toBe("transporte");
  });

  it("aceita 'eventos'", () => {
    expect(AreaDeAjuda.from("eventos").valor).toBe("eventos");
  });

  it("aceita 'divulgacao'", () => {
    expect(AreaDeAjuda.from("divulgacao").valor).toBe("divulgacao");
  });

  it("rejeita áreas não permitidas", () => {
    expect(() => AreaDeAjuda.from("financeiro")).toThrowError(ValidationError);
  });
});

describe("StatusVoluntario", () => {
  it("aceita 'ativo'", () => {
    expect(StatusVoluntario.from("ativo").valor).toBe("ativo");
  });

  it("aceita 'inativo'", () => {
    expect(StatusVoluntario.from("inativo").valor).toBe("inativo");
  });

  it("rejeita status desconhecidos", () => {
    expect(() => StatusVoluntario.from("pendente")).toThrowError(ValidationError);
  });
});
