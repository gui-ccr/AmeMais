describe("404 Not Found Page", () => {
  it("should offer a login link when the visitor is not authenticated", () => {
    // Visit a non-existent route.
    // We use failOnStatusCode: false so Cypress doesn't fail the test when it receives a 404 status.
    cy.visit("/rota-que-nao-existe", { failOnStatusCode: false });

    // Check if the title is correct
    cy.contains("Página não encontrada").should("be.visible");

    // Without a session, the fallback points to /login, not the panel
    cy.contains("Ir para o login").should("be.visible");
    cy.contains("Voltar ao painel").should("not.exist");
  });
});
