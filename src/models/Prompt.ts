import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import PromptCategory from './PromptCategory';

@Table({
  tableName: 'prompts',
  timestamps: false,
})
export default class Prompt extends Model {
  @PrimaryKey
  @Column
  id: string;

  @ForeignKey(() => PromptCategory)
  @Column({
    field: 'category_id',
  })
  categoryId: string;

  @BelongsTo(() => PromptCategory)
  category: PromptCategory;

  @Column
  content: string;
}
