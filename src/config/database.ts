import { Sequelize } from 'sequelize';
import { env } from './env';

export const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'postgres',
  logging: false,
  define: {
    // Padrão das tabelas do desafio: snake_case e apenas "criado_em"
    underscored: true,
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: false,
  },
});
