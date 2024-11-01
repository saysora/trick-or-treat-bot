import {
  BelongsTo,
  Column,
  DataType,
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
export default class Prompt extends Model<Partial<Prompt>> {
  @PrimaryKey
  @IsUUID(4)
  @Column({
    defaultValue: DataType.UUIDV4(),
  })
  id: string;

  @ForeignKey(() => PromptCategory)
  @Column
  categoryId: string;

  @BelongsTo(() => PromptCategory)
  category: PromptCategory;

  @Column
  content: string;
}
