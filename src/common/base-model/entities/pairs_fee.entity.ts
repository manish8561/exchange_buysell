import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  Index,
} from "sequelize-typescript";
import { Pairs } from "./pairs.entity";
@Table({
  tableName: "pairs_fee",
})
export class PairsFee extends Model {
  @Column({
    type: "binary(16)",
    allowNull: false,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => Pairs)
  @Column({
    type: "binary(16)",
    allowNull: false,
    comment: "ref. id from pairs table",
  })
  @Index({
    name: "pair_id index",
    using: "BTREE",
    order: "ASC",
    unique: false,
  })
  pair_id: string;

  @BelongsTo(() => Pairs, "pair_id")
  pair?: Pairs;

  @Column({
    allowNull: true,
    type: DataType.ENUM("buy", "sell"),
  })
  type?: string;

  @Column({
    allowNull: true,
    type: DataType.DOUBLE,
  })
  fee?: number;

  @Column({
    allowNull: true,
    type: DataType.ENUM("percentage", "flat"),
  })
  fee_type?: string;

  @Column({
    allowNull: true,
    type: DataType.DOUBLE,
  })
  order_limit?: number;

  @Column({
    allowNull: true,
    type: DataType.DOUBLE,
  })
  max_order_limit?: number;

  @Column({
    type: DataType.TINYINT,
    defaultValue: "0",
    allowNull: false,
    comment: "0=YES,1=NO",
  })
  is_swap: number;

  @Column({
    type: DataType.ENUM("YES", "NO"),
    comment: "active=>YES,deactive=>NO",
    defaultValue: "YES",
  })
  is_enable?: string;

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
}
