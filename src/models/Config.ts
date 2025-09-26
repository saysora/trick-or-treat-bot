import {
  Column,
  DataType,
  IsDate,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({
  tableName: 'config',
  timestamps: false,
})
export default class Config extends Model<Config, Partial<Config>> {
  @PrimaryKey
  @Column
  declare id: number;

  @Column
  declare enabled: boolean;

  @Column
  declare cooldownEnabled: boolean;

  @Column
  declare cooldownTime: number;

  @Column
  declare cooldownUnit: string;

  @IsDate
  @Column({
    type: DataType.DATE,
  })
  declare startDate: Date | null;

  @IsDate
  @Column({
    type: DataType.DATE,
  })
  declare endDate: Date | null;
}
