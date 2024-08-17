import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { CurrencyMaster } from "./currency_master.entity";
import { Pairs } from "./pairs.entity";
@Table({
  tableName: "orders_fiat",
})
export class OrdersFiat extends Model {
  @Column({
    type: "binary(16)",

    allowNull: false,
    primaryKey: true,
  })
  id: string;

  @Column({
    allowNull: false,
    type: "binary(16)",
    comment: "User Id from user table",
  })
  @Index({
    name: "member_id",
    using: "BTREE",
    order: "ASC",
    unique: false,
  })
  member_id?: string;

  @Column({
    type: DataType.DOUBLE,
    comment: "actual buy/sell order qty",
  })
  order_qty!: number;

  @Column({
    type: DataType.DOUBLE,
    comment: " its (order_qty-fee)",
  })
  amount!: number;

  @Column({
    type: DataType.DOUBLE,
  })
  fee!: number;

  @Column({
    type: "binary(16)",
    comment: "buy=bank id of admin, sell=bank id of user",
  })
  bank_id!: string;

  @ForeignKey(() => CurrencyMaster)
  @Column({
    type: "binary(16)",
    allowNull: false,
  })
  currency_id: string;

  @BelongsTo(() => CurrencyMaster, "currency_id")
  currency?: CurrencyMaster;

  @ForeignKey(() => CurrencyMaster)
  @Column({
    type: "binary(16)",
    allowNull: false,
    comment: "Fiat currency id",
  })
  other_currency_id: string;

  @BelongsTo(() => CurrencyMaster, "other_currency_id")
  other_currency?: CurrencyMaster;

  @Column({
    type: DataType.STRING,
    comment: "bank transfer id",
  })
  tx_id!: string;

  @ForeignKey(() => Pairs)
  @Column({
    allowNull: true,
    type: "binary(16)",
    comment: "ref pair table id",
  })
  pair_id?: string;
  @BelongsTo(() => Pairs, "pair_id")
  pair?: Pairs;

  @Column({
    type: DataType.DOUBLE,
    comment: "reference buy_price or sell_price from market_pairs table",
  })
  actual_price!: number;

  @Column({
    type: DataType.DOUBLE,
    comment: "its = ref price -/+ markup/markdown % fee",
  })
  perprice!: number;

  @Column({
    type: DataType.ENUM("BUY", "SELL"),
  })
  order_type!: string;

  @Column({
    allowNull: true,
    type: DataType.ENUM("BANK", "IPAY"),
  })
  payment_method?: string;

  @Column({
    type: DataType.ENUM("PENDING", "CONFIRMED", "REJECTED"),
    defaultValue: "PENDING",
  })
  approval_status?: string;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  created_at?: Date;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  updated_at?: Date;
}
