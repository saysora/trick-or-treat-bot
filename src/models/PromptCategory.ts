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
export default class PromptCategory extends Model<
  PromptCategory,
  Partial<PromptCategory>
> {
  @PrimaryKey
  @Column({
    type: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
  })
  declare name: keyof typeof CategoryName;

  @HasMany(() => Prompt)
  declare prompts: Prompt[];
}
