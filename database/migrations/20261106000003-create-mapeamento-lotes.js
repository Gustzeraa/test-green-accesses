'use strict';

/**
 * Tabela de integração com o sistema financeiro (externo).
 * - unidade_externa: nome da unidade no formato do financeiro ("17")
 * - id_lote: lote correspondente no sistema da portaria
 * - ordem_pdf: posição (1, 2, 3...) da página desse lote no PDF de boletos
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mapeamento_lotes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      unidade_externa: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      id_lote: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'lotes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ordem_pdf: { type: Sequelize.INTEGER, allowNull: true, unique: true },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('mapeamento_lotes');
  },
};
