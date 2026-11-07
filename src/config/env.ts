import 'dotenv/config';
import path from 'path';

export const env = {
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'green',
    password: process.env.DB_PASSWORD || 'green',
    name: process.env.DB_NAME || 'green_acesso',
  },
  boletosDir: path.resolve(process.env.BOLETOS_DIR || 'storage/boletos'),
};
