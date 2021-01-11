describe('useFieldArrayNested', () => {
  it('should work correctly with nested field array', () => {
    cy.visit('http://localhost:3000/useFieldArrayNested');

    cy.get(`#nest-append-0`).click();
    cy.get(`#nest-prepend-0`).click();
    cy.get(`#nest-insert-0`).click();
    cy.get(`#nest-swap-0`).click();
    cy.get(`#nest-move-0`).click();

    cy.get('input[name="test.0.keyValue.0.name"]').should(
      'have.value',
      'insert',
    );
    cy.get('input[name="test.0.keyValue.1.name"]').should(
      'have.value',
      'prepend',
    );
    cy.get('input[name="test.0.keyValue.2.name"]').should('have.value', '1a');
    cy.get('input[name="test.0.keyValue.3.name"]').should('have.value', '1c');
    cy.get('input[name="test.0.keyValue.4.name"]').should(
      'have.value',
      'append',
    );

    cy.get(`#nest-remove-0`).click();
    cy.get('input[name="test.0.keyValue.2.name"]').should('have.value', '1c');
    cy.get('input[name="test.0.keyValue.3.name"]').should(
      'have.value',
      'append',
    );

    cy.get('#dirty-nested-0').should(($state) =>
      expect(JSON.parse($state.text())).to.be.deep.equal({
        test: [
          {
            keyValue: [
              { name: true },
              { name: true },
              { name: true },
              { name: true },
            ],
          },
        ],
      }),
    );

    cy.get('#touched-nested-0').should(($state) =>
      expect(JSON.parse($state.text())).to.be.deep.equal({
        test: [{ keyValue: [{ name: true }, null, null, { name: true }] }],
      }),
    );

    cy.get('#prepend').click();

    cy.get('#dirty-nested-0').should(($state) =>
      expect(JSON.parse($state.text())).to.be.deep.equal({
        test: [
          {
            firstName: true,
            lastName: true,
            keyValue: [{ name: true }, { name: true }],
          },
          {
            firstName: true,
            lastName: true,
            keyValue: [
              { name: true },
              { name: true },
              { name: true },
              { name: true },
            ],
          },
        ],
      }),
    );

    cy.get('#touched-nested-0').should(($state) =>
      expect(JSON.parse($state.text())).to.be.deep.equal({
        test: [
          null,
          { keyValue: [{ name: true }, null, null, { name: true }] },
        ],
      }),
    );

    cy.get('#append').click();
    cy.get('#swap').click();
    cy.get('#insert').click();

    cy.get('#touched-nested-0').should(($state) =>
      expect(JSON.parse($state.text())).to.be.deep.equal({
        test: [
          { firstName: true },
          null,
          { firstName: true },
          { keyValue: [{ name: true }, null, null, { name: true }] },
        ],
      }),
    );

    cy.get('#dirty-nested-0').should(($state) =>
      expect(JSON.parse($state.text())).to.be.deep.equal({
        test: [
          {
            firstName: true,
            lastName: true,
            keyValue: [
              { name: true },
              { name: true },
              { name: true },
              { name: true },
            ],
          },
          {
            firstName: true,
            lastName: true,
            keyValue: [
              { name: true },
              { name: true },
              { name: true },
              { name: true },
            ],
          },
          {
            firstName: true,
            lastName: true,
            keyValue: [
              { name: true },
              { name: true },
              { name: true },
              { name: true },
            ],
          },
          {
            firstName: true,
            lastName: true,
            keyValue: [
              { name: true },
              { name: true },
              { name: true },
              { name: true },
            ],
          },
        ],
      }),
    );

    cy.get(`#nest-append-0`).click();
    cy.get(`#nest-prepend-0`).click();
    cy.get(`#nest-insert-0`).click();
    cy.get(`#nest-swap-0`).click();
    cy.get(`#nest-move-0`).click();

    cy.get('input').its('length').should('eq', 11);

    cy.get('#nest-remove-3').click();
    cy.get('#nest-remove-3').click();

    cy.get('input[name="test.3.keyValue.0.name"]').should(
      'has.value',
      'insert',
    );
    cy.get('input[name="test.3.keyValue.1.name"]').should(
      'has.value',
      'append',
    );

    // cy.get('#touched-nested-3').should(($state) =>
    //   expect(JSON.parse($state.text())).to.be.deep.equal({
    //     test: [
    //       {
    //         firstName: true,
    //         keyValue: [{ name: true }, { name: true }, { name: true }],
    //       },
    //       { firstName: true },
    //       { firstName: true },
    //       { keyValue: [{ name: true }, { name: true }] },
    //     ],
    //   }),
    // );

    cy.get('#dirty-nested-0').should(($state) =>
      expect(JSON.parse($state.text())).to.be.deep.equal({
        test: [
          {
            firstName: true,
            lastName: true,
            keyValue: [{ name: true }, { name: true }, { name: true }],
          },
          {
            firstName: true,
            lastName: true,
            keyValue: [
              { name: true },
              { name: true },
              { name: true },
              { name: true },
            ],
          },
          {
            firstName: true,
            lastName: true,
            keyValue: [
              { name: true },
              { name: true },
              { name: true },
              { name: true },
            ],
          },
          {
            firstName: true,
            lastName: true,
            keyValue: [{ name: true }, { name: true }],
          },
        ],
      }),
    );

    cy.get('#nest-remove-all-3').click();
    cy.get('#nest-remove-all-2').click();
    cy.get('#nest-remove-all-1').click();
    cy.get('#nest-remove-all-0').click();

    cy.get('#touched-nested-2').contains(
      '{"test":[{"firstName":true},{"firstName":true},{"firstName":true},null]}',
    );

    // cy.get('#dirty-nested-2').should(($state) =>
    //   expect(JSON.parse($state.text())).to.be.deep.equal({
    //     test: [
    //       {
    //         firstName: true,
    //         lastName: true,
    //         keyValue: [{ name: true }, { name: true }],
    //       },
    //       { firstName: true, lastName: true },
    //       { firstName: true, lastName: true },
    //       { firstName: true, lastName: true },
    //     ],
    //   }),
    // );

    // cy.get('#remove').click();
    // cy.get('#remove').click();
    // cy.get('#remove').click();
    //
    // // cy.get('#dirty-nested-0').should(($state) =>
    // //   expect(JSON.parse($state.text())).to.be.deep.equal({
    // //     test: [
    // //       {
    // //         firstName: true,
    // //         lastName: true,
    // //         keyValue: [{ name: true }, { name: true }],
    // //       },
    // //     ],
    // //   }),
    // // );
    // //
    // // cy.get('#touched-nested-0').should(($state) =>
    // //   expect(JSON.parse($state.text())).to.be.deep.equal({
    // //     test: [{ firstName: true }],
    // //   }),
    // // );
    // //
    // // cy.get('#count-nest-0').contains('24');
    //
    // cy.get('#removeAll').click();
    //
    // cy.get('#dirty-nested-0').should('not.exist');
    //
    // cy.get('#touched-nested-0').should('not.exist');
    //
    // cy.get('#count').contains('9');
  });
});
