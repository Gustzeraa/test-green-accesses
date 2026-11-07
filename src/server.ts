import fs from 'fs';
import { app } from './app';
import { sequelize } from './config/database';
import { env } from './config/env';
import './models';

async function bootstrap() {
  await sequelize.authenticate();
  fs.mkdirSync(env.boletosDir, { recursive: true });

  app.listen(env.port, () => {
    console.log(`Servidor rodando em http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Falha ao iniciar a aplicação:', err);
  process.exit(1);
});
