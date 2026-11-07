import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';
import { Op } from 'sequelize';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { Boleto, MapeamentoLote } from '../models';

interface PaginaMapeada {
  pagina: number;
  boleto: Boleto;
}

export class ImportarPdfService {
  async executar(arquivo: Buffer) {
    const pdf = await this.abrirPdf(arquivo);
    const totalPaginas = pdf.getPageCount();

    // 1. Descobre qual boleto corresponde a cada página
    const paginasMapeadas = await this.mapearPaginas(totalPaginas);

    // 2. Confere se o nome impresso em cada página é o do boleto mapeado
    await this.conferirNomes(arquivo, paginasMapeadas);

    // 3. Gera um PDF por página e salva como {id do boleto}.pdf
    await fs.mkdir(env.boletosDir, { recursive: true });

    const arquivosGerados = [];
    for (const { pagina, boleto } of paginasMapeadas) {
      const novoPdf = await PDFDocument.create();
      const [paginaCopiada] = await novoPdf.copyPages(pdf, [pagina - 1]); // pdf-lib começa em 0
      novoPdf.addPage(paginaCopiada);

      const nomeArquivo = `${boleto.id}.pdf`;
      await fs.writeFile(path.join(env.boletosDir, nomeArquivo), await novoPdf.save());

      arquivosGerados.push({
        pagina,
        boleto_id: boleto.id,
        nome_sacado: boleto.nome_sacado,
        arquivo: nomeArquivo,
      });
    }

    return arquivosGerados;
  }

  private async abrirPdf(arquivo: Buffer) {
    try {
      return await PDFDocument.load(arquivo);
    } catch {
      throw new AppError('Não foi possível ler o PDF enviado.');
    }
  }

  /**
   * Página N -> mapeamento com ordem_pdf = N -> lote -> boleto ativo mais recente desse lote.
   */
  private async mapearPaginas(totalPaginas: number): Promise<PaginaMapeada[]> {
    const mapeamentos = await MapeamentoLote.findAll({
      where: { ordem_pdf: { [Op.between]: [1, totalPaginas] }, ativo: true },
    });
    const loteDaPagina = new Map(mapeamentos.map((m) => [m.ordem_pdf, m.id_lote]));

    // Ordenado do mais recente para o mais antigo: o primeiro de cada lote é o atual
    const boletos = await Boleto.findAll({
      where: { id_lote: { [Op.in]: mapeamentos.map((m) => m.id_lote) }, ativo: true },
      order: [['id', 'DESC']],
    });
    const boletoDoLote = new Map<number, Boleto>();
    for (const boleto of boletos) {
      if (!boletoDoLote.has(boleto.id_lote)) boletoDoLote.set(boleto.id_lote, boleto);
    }

    const erros: string[] = [];
    const resultado: PaginaMapeada[] = [];

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      const idLote = loteDaPagina.get(pagina);
      const boleto = idLote ? boletoDoLote.get(idLote) : undefined;

      if (!idLote) erros.push(`Página ${pagina}: nenhum lote mapeado para essa posição`);
      else if (!boleto) erros.push(`Página ${pagina}: lote ${idLote} não tem boleto importado`);
      else resultado.push({ pagina, boleto });
    }

    if (erros.length > 0) {
      throw new AppError('Não foi possível mapear todas as páginas do PDF. Nenhum arquivo foi gerado.', 422, erros);
    }

    return resultado;
  }

  /**
   * Validação extra: a ordem é fixa, mas se o síndico errar a ordem de envio,
   * os boletos iriam para as pessoas erradas. Lendo o texto de cada página,
   * conferimos se o nome do sacado aparece nela antes de gerar os arquivos.
   */
  private async conferirNomes(arquivo: Buffer, paginasMapeadas: PaginaMapeada[]) {
    const parser = new PDFParse({ data: arquivo });
    try {
      const { pages } = await parser.getText();
      const textoDaPagina = new Map(pages.map((p) => [p.num, p.text.toUpperCase()]));

      const divergencias = paginasMapeadas
        .filter(({ pagina, boleto }) => !textoDaPagina.get(pagina)?.includes(boleto.nome_sacado.toUpperCase()))
        .map(({ pagina, boleto }) => `Página ${pagina}: esperado o boleto de "${boleto.nome_sacado}"`);

      if (divergencias.length > 0) {
        throw new AppError(
          'A ordem das páginas não confere com os boletos cadastrados. Nenhum arquivo foi gerado.',
          422,
          divergencias,
        );
      }
    } finally {
      await parser.destroy();
    }
  }
}