import { parse } from 'csv-parse/sync';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { AppError } from '../errors/AppError';
import { Boleto, MapeamentoLote } from '../models';

interface LinhaCsv {
  nome: string;
  unidade: string;
  valor: string;
  linha_digitavel: string;
}

interface ErroLinha {
  linha: number;
  erro: string;
}

const COLUNAS_OBRIGATORIAS = ['nome', 'unidade', 'valor', 'linha_digitavel'];

export class ImportarCsvService {
  async executar(arquivo: Buffer) {
    const linhas = this.lerCsv(arquivo);

    // 1. Busca todos os mapeamentos de uma vez (evita uma consulta por linha)
    const unidades = [...new Set(linhas.map((l) => l.unidade))];
    const mapeamentos = await MapeamentoLote.findAll({
      where: { unidade_externa: { [Op.in]: unidades }, ativo: true },
    });
    const loteDaUnidade = new Map(mapeamentos.map((m) => [m.unidade_externa, m.id_lote]));

    // 2. Valida e monta os boletos, acumulando os erros de todas as linhas
    const erros: ErroLinha[] = [];
    const boletos = linhas.flatMap((linha, i) => {
      const numeroLinha = i + 2; // +1 do índice e +1 do cabeçalho
      const idLote = loteDaUnidade.get(linha.unidade);
      const valor = Number(linha.valor.replace(',', '.'));

      if (!linha.nome) erros.push({ linha: numeroLinha, erro: 'Nome do sacado vazio' });
      if (!idLote) erros.push({ linha: numeroLinha, erro: `Unidade "${linha.unidade}" sem mapeamento` });
      if (!Number.isFinite(valor) || valor <= 0) {
        erros.push({ linha: numeroLinha, erro: `Valor inválido: "${linha.valor}"` });
      }
      if (!linha.linha_digitavel) erros.push({ linha: numeroLinha, erro: 'Linha digitável vazia' });

      if (!idLote) return [];
      return [{
        nome_sacado: linha.nome,
        id_lote: idLote,
        valor: valor.toFixed(2),
        linha_digitavel: linha.linha_digitavel,
      }];
    });

    // 3. Se qualquer linha tiver problema, não importa nada
    if (erros.length > 0) {
      throw new AppError('O CSV contém linhas inválidas. Nenhum boleto foi importado.', 422, erros);
    }

    // 4. Insere tudo numa transação: ou entram todos, ou nenhum
    return sequelize.transaction((transaction) => Boleto.bulkCreate(boletos, { transaction }));
  }

  private lerCsv(arquivo: Buffer): LinhaCsv[] {
    let registros: Record<string, string>[];
    try {
      registros = parse(arquivo, {
        delimiter: ';',
        columns: (cabecalho: string[]) => cabecalho.map((c) => c.trim().toLowerCase()),
        bom: true, // remove o BOM que o Excel coloca no início do arquivo
        trim: true,
        skip_empty_lines: true,
      });
    } catch {
      throw new AppError('Não foi possível ler o CSV. Verifique se o separador é ";".');
    }

    if (registros.length === 0) throw new AppError('O CSV não contém boletos.');

    const faltando = COLUNAS_OBRIGATORIAS.filter((c) => !(c in registros[0]));
    if (faltando.length > 0) {
      throw new AppError(`Colunas obrigatórias ausentes no CSV: ${faltando.join(', ')}`);
    }

    return registros as unknown as LinhaCsv[];
  }
}