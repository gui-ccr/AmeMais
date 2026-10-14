/**
 * Fluxo principal (PRD 5.2): a equipe cadastra um animal no painel e ele aparece
 * no site público, com a foto, sem ninguém mexer no site.
 *
 * Precisa de tudo no ar: Supabase local, apps/api, apps/web-admin e apps/web-public
 * (ver docs/testes-integracao-e2e.md). Cada `it` visita uma origem só (admin ou
 * site), por isso o fluxo é dividido em dois.
 */
const ADMIN_URL = Cypress.env("ADMIN_URL") ?? "http://localhost:3003";
const EMAIL = Cypress.env("E2E_EMAIL") ?? "e2e@amemais.local";
const SENHA = Cypress.env("E2E_PASSWORD") ?? "e2e-senha-local";
/** O Cypress recarrega a spec ao trocar de origem: o nome passa de um teste para o outro por arquivo. */
const ARQUIVO_NOME = "cypress/downloads/e2e-animal.json";

describe("Cadastro no admin aparece no site público", () => {
  it("cadastra um animal disponível, com foto, pelo painel", () => {
    const nome = `E2E ${Date.now()}`;
    cy.writeFile(ARQUIVO_NOME, { nome });

    cy.visit(`${ADMIN_URL}/login`);
    cy.get("#email").type(EMAIL);
    cy.get("#password").type(SENHA, { log: false });
    cy.get("form").submit();
    cy.location("pathname", { timeout: 20_000 }).should("eq", "/admin");

    cy.visit(`${ADMIN_URL}/admin/animais`);
    cy.contains("button", "Cadastrar Novo Animal").click();

    cy.get("#animal-nome").type(nome);
    cy.get("#animal-especie").click();
    cy.get("[role=option]").contains("Cachorro").click();
    cy.get("#animal-raca").type("SRD");
    cy.get("#animal-status").click();
    cy.get("[role=option]").contains("Disponível").click();
    cy.get("input[type=file]").selectFile("cypress/fixtures/animal.png", { force: true });

    cy.contains("button", "Cadastrar animal").click();
    cy.contains("Animal cadastrado com sucesso!", { timeout: 20_000 }).should("be.visible");
  });

  it("o animal aparece em /adote com a foto", () => {
    cy.readFile<{ nome: string }>(ARQUIVO_NOME).then(({ nome }) => {
      cy.visit("/adote");
      cy.contains(nome, { timeout: 20_000 }).should("be.visible");

      // A foto carregou de verdade (não é a imagem de reserva nem um quadro quebrado).
      cy.get(`img[alt="${nome}"]`)
        .should("be.visible")
        .and(($img) => {
          expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
        });
    });
  });
});
