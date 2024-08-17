import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Orders } from "./orders.entity";
@Table({
  tableName: "market_maker_wallets",
})
export class MarketMakerWallets extends Model {
  @Column({
    type: "binary(16)",
    allowNull: false,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => Orders)
  @Column({
    allowNull: false,
    type: "binary(16)",
    comment: "ref order table id",
  })
  @Index({
    name: "primary currency relation",
    using: "BTREE",
    order: "ASC",
    unique: false,
  })
  order_id: string;
  @BelongsTo(() => Orders, "order_id")
  order: Orders;

  @Column({
    type: DataType.DOUBLE,
    comment: "market maker balance",
    defaultValue: "0",
  })
  balance: number;

  @Column({
    type: DataType.DOUBLE,
    comment: "market maker balance in usd",
    defaultValue: "0",
  })
  balance_in_usd: number;

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
}
