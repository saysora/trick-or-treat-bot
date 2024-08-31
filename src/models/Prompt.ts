import {
  BelongsTo,
  Column,
  ForeignKey,
  IsUUID,
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
  @IsUUID(4)
  @Column
  id: string;

  @ForeignKey(() => PromptCategory)
  @Column
  categoryId: string;

  @BelongsTo(() => PromptCategory)
  category: PromptCategory;

  @Column
  content: string;
}
