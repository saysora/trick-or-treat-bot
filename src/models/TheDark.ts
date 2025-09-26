import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import Player from './Player';

export enum DarkStatus {
  I = 'Inactive',
  P = 'passive',
  A = 'Angry',
  W = 'Wicked',
}

@Table({
  tableName: 'the_dark',
  timestamps: false,
})
export default class TheDark extends Model<TheDark, Partial<TheDark>> {
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Player)
  @Column({
    type: DataType.UUIDV4,
    allowNull: true,
  })
  declare target_id: string | null;

  @BelongsTo(() => Player)
  declare target: Player;

  @Column
  declare status: DarkStatus;
}
