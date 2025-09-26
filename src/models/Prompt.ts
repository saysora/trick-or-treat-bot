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
export default class Prompt extends Model<Prompt, Partial<Prompt>> {
  @PrimaryKey
  @IsUUID(4)
  @Column({
    defaultValue: DataType.UUIDV4(),
  })
  declare id: string;

  @ForeignKey(() => PromptCategory)
  @Column
  declare categoryId: string;

  @BelongsTo(() => PromptCategory)
  declare category: PromptCategory;

  @Column
  declare content: string;
}
