import { Op, WhereOptions } from 'sequelize';
import { AppError } from '../errors/AppError';
import { Boleto } from '../models';

export interface FiltrosBoletos {
  nome?: string;
  valor_inicial?: string;
  valor_final?: string;
  id_lote?: string;
}

export class ListarBoletosService {
  async executar(filtros: FiltrosBoletos) {
    const where: WhereOptions<Boleto> = { ativo: true };

    // Busca parcial e sem diferenciar maiúsculas: "jose" encontra "JOSE DA SILVA"
    if (filtros.nome) {
      where.nome_sacado = { [Op.iLike]: `%${filtros.nome.trim()}%` };
    }

    const valorInicial = this.numero(filtros.valor_inicial, 'valor_inicial');
    const valorFinal = this.numero(filtros.valor_final, 'valor_final');

    if (valorInicial !== undefined && valorFinal !== undefined && valorInicial > valorFinal) {
      throw new AppError('valor_inicial não pode ser maior que valor_final');
    }
    if (valorInicial !== undefined || valorFinal !== undefined) {
      where.valor = {
        ...(valorInicial !== undefined && { [Op.gte]: valorInicial }),
        ...(valorFinal !== undefined && { [Op.lte]: valorFinal }),
      };
    }

    const idLote = this.numero(filtros.id_lote, 'id_lote');
    if (idLote !== undefined) where.id_lote = idLote;

    return Boleto.findAll({ where, order: [['id', 'ASC']] });
  }

  /** Converte o parâmetro da URL (sempre string) em número, ou falha com mensagem clara. */
  private numero(valor: string | undefined, campo: string): number | undefined {
    if (valor === undefined || valor === '') return undefined;

    const convertido = Number(valor.replace(',', '.'));
    if (!Number.isFinite(convertido)) {
      throw new AppError(`O filtro "${campo}" deve ser numérico`);
    }
    return convertido;
  }
}