import { describe, expect, it } from "vitest";
import { gerarSenhaProvisoria } from "../src/features/equipe/domain/senha-provisoria";
import {
  createDepartamentoSchema,
  createMembroSchema,
  membroIdParamSchema,
  salvarMatrizSchema,
  trocarMinhaSenhaSchema,
  updateDepartamentosDoMembroSchema,
  updateStatusDoMembroSchema,
} from "../src/features/equipe/schema";

const UUID_A = "3f2b8c1e-5d4a-4b7e-9c1d-0a1b2c3d4e5f";
const UUID_B = "7a9d6e2c-1b3f-4c8a-8d5e-9f0a1b2c3d4e";

describe("gerarSenhaProvisoria", () => {
  it("gera 16 caracteres com maiúscula, minúscula, dígito e símbolo", () => {
    for (let i = 0; i < 200; i++) {
      const senha = gerarSenhaProvisoria();
      expect(senha).toHaveLength(16);
      expect(senha).toMatch(/[A-Z]/);
      expect(senha).toMatch(/[a-z]/);
      expect(senha).toMatch(/\d/);
      expect(senha).toMatch(/[!@#$%&*?]/);
      expect(senha).not.toMatch(/[0OIl1]/);
    }
  });

  it("não repete a senha entre chamadas", () => {
    const senhas = new Set(Array.from({ length: 100 }, () => gerarSenhaProvisoria()));
    expect(senhas.size).toBe(100);
  });

  it("recusa tamanho menor que 12", () => {
    expect(() => gerarSenhaProvisoria(8)).toThrow(RangeError);
  });
});

describe("createMembroSchema", () => {
  it("normaliza nome e e-mail e assume lista vazia de departamentos", () => {
    const r = createMembroSchema.parse({ nome: "  Ana Souza ", email: " ANA@Exemplo.COM " });
    expect(r).toEqual({ nome: "Ana Souza", email: "ana@exemplo.com", departamentoIds: [] });
  });

  it("recusa e-mail inválido, nome curto, ids que não são uuid e ids repetidos", () => {
    expect(createMembroSchema.safeParse({ nome: "Ana", email: "ana" }).success).toBe(false);
    expect(createMembroSchema.safeParse({ nome: "A", email: "a@b.com" }).success).toBe(false);
    expect(createMembroSchema.safeParse({ nome: "Ana", email: "a@b.com", departamentoIds: ["x"] }).success).toBe(false);
    expect(createMembroSchema.safeParse({ nome: "Ana", email: "a@b.com", departamentoIds: [UUID_A, UUID_A] }).success).toBe(false);
  });
});

describe("demais schemas", () => {
  it("PUT de departamentos do membro exige a chave departamentoIds", () => {
    expect(updateDepartamentosDoMembroSchema.safeParse({}).success).toBe(false);
    expect(updateDepartamentosDoMembroSchema.safeParse({ departamentoIds: [] }).success).toBe(true);
  });

  it("status exige booleano", () => {
    expect(updateStatusDoMembroSchema.safeParse({ ativo: "sim" }).success).toBe(false);
    expect(updateStatusDoMembroSchema.parse({ ativo: false })).toEqual({ ativo: false });
  });

  it("matriz aceita só total, leitura ou null, e recusa módulo repetido", () => {
    const ok = salvarMatrizSchema.safeParse({
      permissoes: [
        { moduloId: UUID_A, nivel: "total" },
        { moduloId: UUID_B, nivel: null },
      ],
    });
    expect(ok.success).toBe(true);
    expect(salvarMatrizSchema.safeParse({ permissoes: [{ moduloId: UUID_A, nivel: "admin" }] }).success).toBe(false);
    expect(salvarMatrizSchema.safeParse({ permissoes: [{ moduloId: UUID_A }] }).success).toBe(false);
    expect(
      salvarMatrizSchema.safeParse({
        permissoes: [
          { moduloId: UUID_A, nivel: "total" },
          { moduloId: UUID_A, nivel: "leitura" },
        ],
      }).success,
    ).toBe(false);
  });

  it("departamento: descrição vazia vira null", () => {
    expect(createDepartamentoSchema.parse({ nome: " Marketing ", descricao: "  " })).toEqual({ nome: "Marketing", descricao: null });
  });

  it("id de rota precisa ser uuid", () => {
    expect(membroIdParamSchema.safeParse({ id: "1" }).success).toBe(false);
  });

  it("senha própria: 8 a 72 caracteres", () => {
    expect(trocarMinhaSenhaSchema.safeParse({ senha: "curta" }).success).toBe(false);
    expect(trocarMinhaSenhaSchema.safeParse({ senha: "x".repeat(73) }).success).toBe(false);
    expect(trocarMinhaSenhaSchema.safeParse({ senha: "umasenhaboa1" }).success).toBe(true);
  });
});
