import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Lote extends Model<InferAttributes<Lote>, InferCreationAttributes<Lote>> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare ativo: CreationOptional<boolean>;
  declare criado_em: CreationOptional<Date>;
}

Lote.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    criado_em: DataTypes.DATE,
  },
  { sequelize, tableName: 'lotes' },
);
