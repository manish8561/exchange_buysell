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
  tableName: "orders",
})
export class Orders extends Model {
  @Column({
    type: "binary(16)",
    allowNull: false,
    primaryKey: true,
  })
  id: string;

  @Column({
    allowNull: true,
    type: DataType.ENUM("BUY", "SELL"),
  })
  order_type: string;

  @ForeignKey(() => Pairs)
  @Column({
    allowNull: true,
    type: "binary(16)",
    comment: "ref pair table id",
  })
  pair_id: string;
  @BelongsTo(() => Pairs, "pair_id")
  pair: Pairs;

  @ForeignKey(() => CurrencyMaster)
  @Column({
    type: "binary(16)",
    allowNull: false,
    comment: "For all buy orders",
  })
  @Index({
    name: "primary currency relation",
    using: "BTREE",
    order: "ASC",
    unique: false,
  })
  primary_currency_id: string;

  @BelongsTo(() => CurrencyMaster, "primary_currency_id")
  primary_currency: CurrencyMaster;

  @ForeignKey(() => CurrencyMaster)
  @Column({
    allowNull: true,
    type: "binary(16)",
    comment: "For all sell orders",
  })
  secondary_currency_id?: string;

  @BelongsTo(() => CurrencyMaster, "secondary_currency_id")
  secondary_currency: CurrencyMaster;

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
  member_id: string;

  @Column({
    allowNull: false,
    type: "binary(16)",
    comment: "client id from user table for wallet",
  })
  client_id: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(255),
    comment: "User email from user table",
  })
  @Index({
    name: "email",
    using: "BTREE",
    order: "ASC",
    unique: false,
  })
  email: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(200),
  })
  country: string;

  @Column({
    allowNull: true,
    type: "binary(16)",
  })
  market_maker_id: string;

  @Column({
    allowNull: true,
    type: "binary(16)",
  })
  market_maker_client_id: string;

  @Column({
    allowNull: true,
    type: DataType.ENUM(
      "PENDING",
      "COMPLETED",
      "CANCELED",
      "PARTIALLY_FILLED",
      "PENDING_CANCEL",
      "QUEUE",
      "NEW",
      "FILLED",
      "EXPIRED",
      "REJECTED",
      "FAILED",
      "RETRY",
      "LIQUIDITY_PUSHED",
      "LIQUIDITY_SUCCESS",
      "LIQUIDITY_FAIL",
      "PAYMENT_PENDING",
      "MARKET_MAKER_PAYMENT_PENDING",
      "MARKET_MAKER_LIQUIDITY_SUCCESS"
    ),
  })
  order_status?: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: "0",
  })
  retries: number;

  @Column({
    allowNull: true,
    type: DataType.TEXT,
  })
  reason: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: "0",
  })
  is_processed: number;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  created_at: Date;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  updated_at: Date;

  @Column({
    type: DataType.ENUM("MARKET", "LIMIT"),
    defaultValue: "MARKET",
  })
  type?: string;

  @Column({
    type: DataType.TINYINT,
    defaultValue: 0,
  })
  is_swap: number;

  @Column({
    type: DataType.TINYINT,
    defaultValue: 0,
  })
  is_market_maker: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  chain_id: number;

  @Column({
    type: DataType.DOUBLE,
    comment: "actual buy/sell order qty",
    defaultValue: "0",
  })
  order_qty!: number;

  @Column({
    type: DataType.DOUBLE,
    comment: "user qty",
    defaultValue: "0",
  })
  qty: number;

  @Column({
    type: DataType.DOUBLE,
    comment: "markup/markdwon qty for crypto token",
    defaultValue: "0",
  })
  markupdown_qty: number;

  @Column({
    type: DataType.DOUBLE,
    comment: "its fee in qty for crypto token",
    defaultValue: "0",
  })
  fee_in_qty: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  total_price: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  actual_total_price: number;

  @Column({
    type: DataType.DOUBLE,
    comment: "reference buy_price or sell_price from market_pairs table",
    defaultValue: "0",
  })
  actual_price: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  markupdown_price: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  fee!: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  markupdown_fee: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  markupdown_fee_in_qty: number;

  @Column({
    allowNull: true,
    type: DataType.DOUBLE,
    comment: "usd price for limit order",
  })
  per_price_usd: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  qty_in_usd: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  fee_in_usd: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  markupdown_price_in_usd: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  markupdown_fee_in_usd: number;

  @Column({
    type: DataType.DOUBLE,
    defaultValue: "0",
  })
  total_price_usd: number;
}
