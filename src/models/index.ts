import { Boleto } from './Boleto';
import { Lote } from './Lote';
import { MapeamentoLote } from './MapeamentoLote';

Lote.hasMany(Boleto, { foreignKey: 'id_lote', as: 'boletos' });
Boleto.belongsTo(Lote, { foreignKey: 'id_lote', as: 'lote' });

Lote.hasOne(MapeamentoLote, { foreignKey: 'id_lote', as: 'mapeamento' });
MapeamentoLote.belongsTo(Lote, { foreignKey: 'id_lote', as: 'lote' });

export { Boleto, Lote, MapeamentoLote };
