import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Setting extends Document {
  @Prop({ unique: true })
  name: string;

  @Prop({ unique: true })
  value: string;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
