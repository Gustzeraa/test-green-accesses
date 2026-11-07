'use strict';

// Lotes do sistema da portaria. Os ids são fixos para bater com o enunciado
// (0017 -> 3, 0018 -> 6, 0019 -> 7); os demais existem só para mostrar que
// a importação não depende da ordem nem de ids sequenciais.
const lotes = [
  { id: 1, nome: '0011' },
  { id: 2, nome: '0012' },
  { id: 3, nome: '0017' },
  { id: 4, nome: '0013' },
  { id: 5, nome: '0014' },
  { id: 6, nome: '0018' },
  { id: 7, nome: '0019' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'lotes',
      lotes.map((l) => ({ ...l, ativo: true, criado_em: new Date() })),
    );
    // Como inserimos ids manualmente, ajusta a sequence do Postgres
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('lotes', 'id'), (SELECT MAX(id) FROM lotes));",
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('lotes', null, {});
  },
};
