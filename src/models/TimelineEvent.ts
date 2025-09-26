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
export default class TimelineEvent extends Model<
  TimelineEvent,
  Partial<TimelineEvent>
> {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Player)
  @Column
  declare playerId: string;

  @BelongsTo(() => Player)
  declare player: Player;

  @ForeignKey(() => Prompt)
  @Column({
    type: DataType.UUIDV4,
  })
  declare promptId: string | null;

  @BelongsTo(() => Prompt)
  declare prompt: Prompt | null;

  @Column
  declare eventType: TIMELINE_EVENT;

  @Column
  declare roll: number;

  @Column
  declare candyAmount: number;

  @Column({
    type: DataType.DATE,
    defaultValue: new Date(),
  })
  declare date: Date;
}
