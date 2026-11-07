import { Router } from 'express';
import { uploadCsv, uploadPdf } from '../config/upload';
import { BoletoController } from '../controllers/BoletoController';

const controller = new BoletoController();

export const boletosRoutes = Router();

boletosRoutes.post('/importar-csv', uploadCsv.single('arquivo'), controller.importarCsv);
boletosRoutes.post('/importar-pdf', uploadPdf.single('arquivo'), controller.importarPdf);
boletosRoutes.get('/', controller.listar);