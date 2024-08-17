import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  Index,
  HasMany,
} from "sequelize-typescript";
import { CurrencyMaster } from "./currency_master.entity";
import { PairsFee } from "./pairs_fee.entity";
import { Orders } from "./orders.entity";
@Table({
  tableName: "pairs",
})
export class Pairs extends Model {
  @Column({
    type: "binary(16)",
    allowNull: false,
    primaryKey: true,
  })
  id: string;

  @HasMany(() => PairsFee, "pair_id")
  pairs_fee: PairsFee;

  @HasMany(() => Orders, "pair_id")
  orders: Orders;

  @ForeignKey(() => CurrencyMaster)
  @Column({
    type: "binary(16)",
    allowNull: false,
  })
  @Index({
    name: "cur_master relation",
    using: "BTREE",
    order: "ASC",
    unique: false,
  })
  currency_id: string;

  @BelongsTo(() => CurrencyMaster, "currency_id")
  currency?: CurrencyMaster;

  @ForeignKey(() => CurrencyMaster)
  @Column({
    type: "binary(16)",
    allowNull: false,
  })
  @Index({
    name: "cur_master relation 2",
    using: "BTREE",
    order: "ASC",
    unique: false,
  })
  other_currency_id: string;

  @BelongsTo(() => CurrencyMaster, "other_currency_id")
  other_currency: CurrencyMaster;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    comment: "Crypto pair label",
  })
  pair_name: string;

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
    type: DataType.TINYINT,
    defaultValue: "0",
    allowNull: false,
    comment: "0=not exist in market,1= exist in market",
  })
  exist_in_market: number;

  @Column({
    type: DataType.TINYINT,
    defaultValue: "0",
    allowNull: false,
    comment: "0=YES,1=NO",
  })
  is_swap: number;

  @Column({
    type: DataType.ENUM,
    values: ["YES", "NO"],
    defaultValue: "YES",
    allowNull: false,
  })
  is_enable: string;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: 0,
  })
  reference_price: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: 0,
  })
  markup_percentage: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: 0,
  })
  markdown_percentage!: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: 0,
  })
  markup!: number; //markup value for buy set by admin in percentage
  //admin fee is implemented on this.

  @Column({
    type: DataType.DOUBLE,
    defaultValue: 0,
  })
  markdown!: number; //markdown value for sell set by admin in percentage

  @Column({
    allowNull: true,
    type: DataType.STRING(50),
  })
  exchange_pair: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(50),
  })
  exchange_pair_name: string;
  @Column({
    type: DataType.INTEGER,
    comment:
      "0 => All active, 1 => BUY Disable, 2 => SELL Disable, 3 => Both Disable",
    defaultValue: "0",
    allowNull: false,
  })
  active_status: number;
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  chain_id: number;
}
