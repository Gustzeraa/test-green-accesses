'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('boletos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nome_sacado: { type: Sequelize.STRING(255), allowNull: false },
      id_lote: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'lotes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      valor: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      // Não é UNIQUE: no CSV de exemplo todas as linhas têm a mesma linha digitável
      linha_digitavel: { type: Sequelize.STRING(255), allowNull: false },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      criado_em: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('boletos', ['id_lote']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('boletos');
  },
};
