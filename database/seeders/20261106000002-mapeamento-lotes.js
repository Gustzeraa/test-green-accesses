'use strict';

// Unidade do financeiro -> lote da portaria + posição fixa no PDF do síndico
// (o PDF chega na ordem: MARCIA (19), JOSE (17), MARCOS (18))
const mapeamentos = [
  { unidade_externa: '17', id_lote: 3, ordem_pdf: 2 },
  { unidade_externa: '18', id_lote: 6, ordem_pdf: 3 },
  { unidade_externa: '19', id_lote: 7, ordem_pdf: 1 },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'mapeamento_lotes',
      mapeamentos.map((m) => ({ ...m, ativo: true, criado_em: new Date() })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('mapeamento_lotes', null, {});
  },
};
