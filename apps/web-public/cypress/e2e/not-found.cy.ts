describe("404 Not Found Page", () => {
  it("should display the not found page for an invalid route", () => {
    // Visit a non-existent route. 
    // We use failOnStatusCode: false so Cypress doesn't fail the test when it receives a 404 status.
    cy.visit("/rota-que-nao-existe", { failOnStatusCode: false });

    // Check if the title is correct
    cy.contains("Página não encontrada").should("be.visible");
    
    // Check if the 'Voltar para o início' button is present
    cy.contains("Voltar para o início").should("be.visible");
  });
});
