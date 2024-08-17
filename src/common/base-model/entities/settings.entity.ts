import { Table, Column, Model, DataType } from "sequelize-typescript";
@Table({
  tableName: "settings",
})
export class Settings extends Model {
  @Column({
    type: "binary(16)",

    allowNull: false,
    primaryKey: true,
  })
  sid: string;

  @Column({
    type: DataType.STRING,
  })
  name!: string;

  @Column({
    type: DataType.TINYINT,
    comment: "0=>Level 0, 1=>Level 1, 2=>Level2 ",
  })
  level!: number;

  @Column({
    type: DataType.STRING(25),
    comment: "DAILY, WEEKLY, MONTHLY, YEARLY",
  })
  duration!: string;

  @Column({
    type: DataType.STRING(20),
  })
  bs_limit!: string;

  @Column({
    type: DataType.TINYINT,
    comment: "0=>Inactive, 1=>Active ",
  })
  is_active!: number;

  @Column({
    type: DataType.TINYINT,
    comment: "1=> Account Info, 2=>Account Active, 3=> KYC Verified",
  })
  type!: number;

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
