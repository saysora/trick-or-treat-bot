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
import Prompt from './Prompt';

@Table({
  tableName: 'timeline_events',
  timestamps: false,
})
export default class TimelineEvent extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
  })
  id: string;

  @ForeignKey(() => Player)
  @Column
  playerId: string;

  @BelongsTo(() => Player)
  player: Player;

  @ForeignKey(() => Prompt)
  @Column
  promptId: string;

  @BelongsTo(() => Prompt)
  prompt: Prompt;

  @Column
  date: Date;
}
