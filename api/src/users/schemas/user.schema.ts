import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ unique: true })
  address: string;

  @Prop({ unique: true })
  publicKey: string;

  @Prop()
  nonce: string;

  @Prop()
  username?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
