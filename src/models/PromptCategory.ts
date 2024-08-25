import {
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import Prompt from './Prompt';

export enum CategoryName {
  singularWin = 'singularwin',
  win = 'win',
  critWin = 'critwin',
  falseWin = 'falsewin',
  loss = 'loss',
  totalLoss = 'totalloss',
  gameover = 'gameover',
}

@Table({
  tableName: 'prompt_categories',
  timestamps: false,
})
export default class PromptCategory extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
  })
  id: string;

  @Column({
    type: DataType.STRING,
  })
  name: keyof typeof CategoryName;

  @HasMany(() => Prompt)
  prompts: Prompt[];
}
