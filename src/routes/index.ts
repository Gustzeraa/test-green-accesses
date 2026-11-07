import { Router } from 'express';
import { boletosRoutes } from './boletos.routes';

export const routes = Router();

routes.get('/health', (_req, res) => res.json({ status: 'ok' }));
routes.use('/boletos', boletosRoutes);