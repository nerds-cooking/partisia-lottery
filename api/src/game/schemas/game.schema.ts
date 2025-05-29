import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Game extends Document {
  @Prop({
    unique: true,
    type: String,
    validate: {
      validator: (value: string) => {
        if (typeof value !== 'string') return false;
        const num = Number(value);
        return (
          value.trim() !== '' &&
          !isNaN(num) &&
          Number.isInteger(num) &&
          num >= 0 &&
          num <= 4_294_967_295 // u32 limit
        );
      },
      message: 'gameId must be a numeric string between 0 and 4294967295',
    },
  })
  gameId: string;

  @Prop({ minlength: 3, maxlength: 50 })
  name: string;

  @Prop({ minlength: 10, maxlength: 200 })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  questions: Array<{
    question: string;
    answers: Array<{
      answer: string;
    }>;
  }>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ type: 'string', ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ required: true })
  deadline: Date;

  @Prop({ required: true, unique: true })
  creationTxn: string;

  @Prop()
  finishTxn: string;
}

export const GameSchema = SchemaFactory.createForClass(Game);
