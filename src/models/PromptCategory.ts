import {
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import Prompt from './Prompt';
import {StoryCategory} from '../constants';

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
  declare name: StoryCategory;

  @HasMany(() => Prompt)
  declare prompts: Prompt[];
}
