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
export default class Config extends Model<Config> {
  @PrimaryKey
  @Column
  id: number;

  @Column
  enabled: boolean;

  @Column
  cooldownEnabled: boolean;

  @Column
  cooldownTime: number;

  @Column
  cooldownUnit: string;

  @IsDate
  @Column({
    type: DataType.DATE,
  })
  startDate: Date | null;

  @IsDate
  @Column({
    type: DataType.DATE,
  })
  endDate: Date | null;
}
