import multer from 'multer';
import { AppError } from '../errors/AppError';

/**
 * Cria um middleware de upload que aceita apenas a extensão informada.
 * O arquivo fica em memória (req.file.buffer): não precisamos salvá-lo como veio.
 */
function criarUpload(extensao: string, tamanhoMaximoMb: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: tamanhoMaximoMb * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.originalname.toLowerCase().endsWith(extensao)) {
        return cb(new AppError(`O arquivo enviado deve ser um ${extensao}`));
      }
      cb(null, true);
    },
  });
}

export const uploadCsv = criarUpload('.csv', 5);
export const uploadPdf = criarUpload('.pdf', 20);