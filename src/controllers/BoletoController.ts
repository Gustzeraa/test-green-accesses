import { Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { ImportarCsvService } from '../services/ImportarCsvService';
import { ImportarPdfService } from '../services/ImportarPdfService';
import { GerarRelatorioService } from '../services/GerarRelatorioService';
import { FiltrosBoletos, ListarBoletosService } from '../services/ListarBoletosService';

export class BoletoController {
  async importarCsv(req: Request, res: Response) {
    if (!req.file) throw new AppError('Envie o arquivo CSV no campo "arquivo".');

    const boletos = await new ImportarCsvService().executar(req.file.buffer);

    return res.status(201).json({
      mensagem: `${boletos.length} boleto(s) importado(s) com sucesso.`,
      boletos,
    });
  }

    async importarPdf(req: Request, res: Response) {
    if (!req.file) throw new AppError('Envie o arquivo PDF no campo "arquivo".');

    const arquivos = await new ImportarPdfService().executar(req.file.buffer);

    return res.status(201).json({
      mensagem: `${arquivos.length} boleto(s) separado(s) com sucesso.`,
      arquivos,
    });
  }

    async listar(req: Request, res: Response) {
    const filtros = req.query as FiltrosBoletos;
    const boletos = await new ListarBoletosService().executar(filtros);

    if (req.query.relatorio === '1') {
      const base64 = await new GerarRelatorioService().executar(boletos);
      return res.json({ base64 });
    }

    return res.json(boletos);
  }
}