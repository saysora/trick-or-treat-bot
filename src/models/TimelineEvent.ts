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
import {TIMELINE_EVENT} from '../constants';

@Table({
  tableName: 'timeline_events',
  timestamps: false,
})
export default class TimelineEvent extends Model<Partial<TimelineEvent>> {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    defaultValue: DataType.UUIDV4,
  })
  id: string;

  @ForeignKey(() => Player)
  @Column
  playerId: string;

  @BelongsTo(() => Player)
  player: Player;

  @ForeignKey(() => Prompt)
  @Column({
    type: DataType.UUIDV4,
  })
  promptId: string | null;

  @BelongsTo(() => Prompt)
  prompt: Prompt | null;

  @Column
  eventType: TIMELINE_EVENT;

  @Column
  roll: number;

  @Column
  candyAmount: number;

  @Column({
    type: DataType.DATE,
    defaultValue: new Date(),
  })
  date: Date;
}
