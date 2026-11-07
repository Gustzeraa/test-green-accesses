import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Boleto extends Model<InferAttributes<Boleto>, InferCreationAttributes<Boleto>> {
  declare id: CreationOptional<number>;
  declare nome_sacado: string;
  declare id_lote: number;
  // DECIMAL volta do Postgres como string para não perder precisão
  declare valor: string;
  declare linha_digitavel: string;
  declare ativo: CreationOptional<boolean>;
  declare criado_em: CreationOptional<Date>;
}

Boleto.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome_sacado: { type: DataTypes.STRING(255), allowNull: false },
    id_lote: { type: DataTypes.INTEGER, allowNull: false },
    valor: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    linha_digitavel: { type: DataTypes.STRING(255), allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    criado_em: DataTypes.DATE,
  },
  { sequelize, tableName: 'boletos' },
);
