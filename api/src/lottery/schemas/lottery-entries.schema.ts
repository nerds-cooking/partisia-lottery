import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class LotteryEntry extends Document {
  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop({
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
  userId: Types.ObjectId;

  @Prop({ required: true, type: 'string' })
  entryTxn: string;

  @Prop({ required: true, type: 'string' })
  entryCost: string;

  @Prop({ required: true, type: 'string' })
  entryCount: string;
}

export const LotteryEntriesSchema = SchemaFactory.createForClass(LotteryEntry);
