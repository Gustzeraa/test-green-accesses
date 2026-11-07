import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/database';

/**
 * Faz a ponte entre o sistema financeiro (externo) e a portaria (interno):
 * unidade "17" do financeiro -> lote id 3 ("0017") na portaria,
 * e em qual página do PDF de boletos esse lote aparece.
 */
export class MapeamentoLote extends Model<
  InferAttributes<MapeamentoLote>,
  InferCreationAttributes<MapeamentoLote>
> {
  declare id: CreationOptional<number>;
  declare unidade_externa: string;
  declare id_lote: number;
  declare ordem_pdf: number | null;
  declare ativo: CreationOptional<boolean>;
  declare criado_em: CreationOptional<Date>;
}

MapeamentoLote.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    unidade_externa: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    id_lote: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    ordem_pdf: { type: DataTypes.INTEGER, allowNull: true, unique: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    criado_em: DataTypes.DATE,
  },
  { sequelize, tableName: 'mapeamento_lotes' },
);
