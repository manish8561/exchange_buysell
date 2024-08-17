import { Table, Column, Model, DataType } from "sequelize-typescript";
@Table({
  tableName: "orders_stats",
})
export class OrderStats extends Model {
  @Column({
    type: "binary(16)",
    allowNull: false,
    primaryKey: true,
  })
  id: string;
  @Column({
    type: DataType.DOUBLE,
  })
  total_buy: number;
  @Column({
    type: DataType.DOUBLE,
  })
  total_sell: number;
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
