import sequelize from "sequelize";
import { Table, Column, Model, DataType } from "sequelize-typescript";
@Table({
  tableName: "currency_master",
})
export class CurrencyMaster extends Model {
  @Column({
    type: "binary(16)",
    // defaultValue: DataType.UUIDV4,
    allowNull: false,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  currency_name: string;
  @Column({
    type: DataType.STRING(45),
    allowNull: false,
  })
  currency_symbol: string;
  @Column({
    type: DataType.ENUM,
    values: ["YES", "NO"],
    defaultValue: "NO",
    allowNull: false,
  })
  is_erc20token: string;
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  is_fiat_currency: number; // 0,1
  @Column({
    type: DataType.STRING,
  })
  token_abi: string;
  @Column({
    type: DataType.STRING(50),
  })
  token_address: string;
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  chain_id: number;
  @Column({
    type: DataType.DOUBLE,
  })
  smallest_unit: number;
  @Column({
    type: DataType.DOUBLE,
  })
  exchange_price_per_usd: number;
  @Column({
    type: DataType.ENUM,
    values: ["YES", "NO"],
    defaultValue: "NO",
  })
  is_active: string;
  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  decimals: number;
  @Column({
    allowNull: false,
  })
  logo: string;
  @Column({
    type: DataType.DATE,
    field: "created_at",
  })
  createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: "updated_at",
  })
  updatedAt: Date;
  @Column({
    type: DataType.DOUBLE,
    defaultValue: 0,
  })
  market_cap: number;
}
