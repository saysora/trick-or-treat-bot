import {Column, DataType, Model, PrimaryKey, Table} from 'sequelize-typescript';

@Table({
  tableName: 'players',
  timestamps: false,
})
export default class Player extends Model {
  @PrimaryKey
  @Column
  id: string;

  @Column
  serverId: string;

  @Column
  isDead: boolean;

  @Column({
    type: DataType.DATE,
  })
  latestAttempt: Date;

  // Main player stats
  @Column
  candy: number;

  @Column
  gatherAttempts: number;

  @Column
  lostCandyCount: number;

  @Column
  allCandyLostCount: number;

  // Undead player stats
  @Column
  destroyedCandy: number;
}
