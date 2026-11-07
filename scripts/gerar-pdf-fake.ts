import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Ordem FIXA em que o síndico envia os boletos (diferente da ordem do CSV)
const paginas = [
  { nome: 'MARCIA CARVALHO', unidade: '19', valor: '128,00' },
  { nome: 'JOSE DA SILVA', unidade: '17', valor: '182,54' },
  { nome: 'MARCOS ROBERTO', unidade: '18', valor: '178,20' },
];

async function gerar() {
  const pdf = await PDFDocument.create();
  const fonte = await pdf.embedFont(StandardFonts.Helvetica);
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const boleto of paginas) {
    const pagina = pdf.addPage([595, 842]); // tamanho A4 em pontos
    pagina.drawText('CONDOMINIO GREEN PARK - BOLETO (FICTICIO)', { x: 50, y: 780, size: 14, font: negrito });
    pagina.drawText(`Sacado: ${boleto.nome}`, { x: 50, y: 740, size: 12, font: fonte });
    pagina.drawText(`Unidade: ${boleto.unidade}`, { x: 50, y: 720, size: 12, font: fonte });
    pagina.drawText(`Valor: R$ ${boleto.valor}`, { x: 50, y: 700, size: 12, font: fonte });
    pagina.drawText('Linha digitavel: 123456123456123456', { x: 50, y: 680, size: 12, font: fonte });
    pagina.drawText('Documento sem valor - gerado para o desafio tecnico', {
      x: 50, y: 50, size: 9, font: fonte, color: rgb(0.5, 0.5, 0.5),
    });
  }

  const destino = path.resolve('fixtures', 'boletos.pdf');
  fs.writeFileSync(destino, await pdf.save());
  console.log(`PDF gerado em ${destino}`);
}

gerar();