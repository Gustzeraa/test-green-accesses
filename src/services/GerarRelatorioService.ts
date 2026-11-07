import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { Boleto } from '../models';

// Página A4 deitada (paisagem), para caber a linha digitável inteira
const LARGURA = 842;
const ALTURA = 595;
const MARGEM = 40;
const ALTURA_LINHA = 20;
const Y_CABECALHO_TABELA = ALTURA - MARGEM - 60; // abaixo do título
const Y_PRIMEIRA_LINHA = Y_CABECALHO_TABELA - ALTURA_LINHA;

const COLUNAS = [
  { titulo: 'ID', largura: 50, valor: (b: Boleto) => String(b.id) },
  { titulo: 'NOME DO SACADO', largura: 260, valor: (b: Boleto) => b.nome_sacado },
  { titulo: 'ID LOTE', largura: 70, valor: (b: Boleto) => String(b.id_lote) },
  { titulo: 'VALOR (R$)', largura: 100, valor: (b: Boleto) => formatarValor(b.valor) },
  { titulo: 'LINHA DIGITAVEL', largura: 282, valor: (b: Boleto) => b.linha_digitavel },
];

function formatarValor(valor: string) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export class GerarRelatorioService {
  private fonte!: PDFFont;
  private negrito!: PDFFont;

  async executar(boletos: Boleto[]): Promise<string> {
    const pdf = await PDFDocument.create();
    this.fonte = await pdf.embedFont(StandardFonts.Helvetica);
    this.negrito = await pdf.embedFont(StandardFonts.HelveticaBold);

    let pagina = this.novaPagina(pdf);
    let y = Y_PRIMEIRA_LINHA;

    if (boletos.length === 0) {
      pagina.drawText('Nenhum boleto encontrado para os filtros informados.', {
        x: MARGEM, y, size: 11, font: this.fonte,
      });
    }

    boletos.forEach((boleto, i) => {
      // Sem espaço na página atual: abre outra e repete o cabeçalho da tabela
      if (y < MARGEM + ALTURA_LINHA) {
        pagina = this.novaPagina(pdf);
        y = Y_PRIMEIRA_LINHA;
      }
      if (i % 2 === 0) {
        pagina.drawRectangle({
          x: MARGEM, y: y - 6, width: LARGURA - MARGEM * 2, height: ALTURA_LINHA,
          color: rgb(0.95, 0.95, 0.95),
        });
      }
      this.desenharLinha(pagina, y, COLUNAS.map((c) => c.valor(boleto)), this.fonte);
      y -= ALTURA_LINHA;
    });

    const total = boletos.reduce((soma, b) => soma + Number(b.valor), 0);
    pagina.drawText(
      `Total: ${boletos.length} boleto(s) - R$ ${formatarValor(total.toFixed(2))}`,
      { x: MARGEM, y: Math.max(y - 15, MARGEM), size: 11, font: this.negrito },
    );

    return Buffer.from(await pdf.save()).toString('base64');
  }

  private novaPagina(pdf: PDFDocument): PDFPage {
    const pagina = pdf.addPage([LARGURA, ALTURA]);
    const topo = ALTURA - MARGEM;

    pagina.drawText('Relatorio de Boletos - Condominio Green Park', {
      x: MARGEM, y: topo - 10, size: 16, font: this.negrito,
    });
    pagina.drawText(`Gerado em ${new Date().toLocaleString('pt-BR')}`, {
      x: MARGEM, y: topo - 28, size: 9, font: this.fonte, color: rgb(0.4, 0.4, 0.4),
    });

    // Cabeçalho da tabela
    pagina.drawRectangle({
      x: MARGEM, y: Y_CABECALHO_TABELA - 6, width: LARGURA - MARGEM * 2, height: ALTURA_LINHA,
      color: rgb(0.13, 0.45, 0.25), // verde
    });
    this.desenharLinha(pagina, Y_CABECALHO_TABELA, COLUNAS.map((c) => c.titulo), this.negrito, rgb(1, 1, 1));

    return pagina;
  }

  private desenharLinha(pagina: PDFPage, y: number, textos: string[], fonte: PDFFont, cor = rgb(0, 0, 0)) {
    let x = MARGEM + 5;
    textos.forEach((texto, i) => {
      pagina.drawText(texto, { x, y, size: 10, font: fonte, color: cor });
      x += COLUNAS[i].largura;
    });
  }
}