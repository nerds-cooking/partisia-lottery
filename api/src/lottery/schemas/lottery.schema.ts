import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Lottery extends Document {
  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

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
      message: 'lotteryId must be a numeric string between 0 and 4294967295',
    },
  })
  lotteryId: string;

  @Prop({ type: 'string', ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ minlength: 3, maxlength: 50 })
  name: string;

  @Prop({ minlength: 10, maxlength: 200 })
  description: string;

  @Prop({ required: true, type: 'string' })
  prizePool: string;

  @Prop({ required: true, type: 'string' })
  entryCost: string;

  @Prop({ required: true })
  deadline: Date;

  @Prop({ required: true, unique: true })
  creationTxn: string;

  @Prop()
  finishTxn: string;
}

export const LotterySchema = SchemaFactory.createForClass(Lottery);
