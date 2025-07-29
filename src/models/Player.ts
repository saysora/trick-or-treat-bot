import {Column, DataType, Model, PrimaryKey, Table} from 'sequelize-typescript';

@Table({
  tableName: 'players',
  timestamps: false,
})
export default class Player extends Model<Player, Partial<Player>> {
  @PrimaryKey
  @Column
  declare id: string;

  @Column
  declare serverId: string;

  @Column
  declare isDead: boolean;

  @Column({
    type: DataType.DATE,
  })
  declare latestAttempt: Date;

  // Main player stats
  @Column
  declare candy: number;

  @Column
  declare gatherAttempts: number;

  @Column
  declare lostCandyCount: number;

  @Column
  declare allCandyLostCount: number;

  // Undead player stats
  @Column
  declare destroyedCandy: number;
}
