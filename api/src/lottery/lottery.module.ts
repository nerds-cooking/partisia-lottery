import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingModule } from 'src/settings/setting.module';
import { UserModule } from 'src/users/user.module';
import { LotteryController } from './controllers/lottery.controller';
import { Lottery, LotterySchema } from './schemas/lottery.schema';
import { LotteryService } from './services/lottery.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lottery.name, schema: LotterySchema }]),
    forwardRef(() => SettingModule),
    forwardRef(() => UserModule),
  ],
  controllers: [LotteryController],
  providers: [LotteryService],
  exports: [LotteryService],
})
export class LotteryModule {}
