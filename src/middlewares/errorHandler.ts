import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { AppError } from '../errors/AppError';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message, detalhes: err.details });
  }

  // Erros do upload (ex.: arquivo maior que o limite)
  if (err instanceof MulterError) {
    return res.status(400).json({ erro: `Erro no upload: ${err.message}` });
  }

  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}