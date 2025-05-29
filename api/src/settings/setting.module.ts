import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameModule } from 'src/game/game.module';
import { SettingController } from './controllers/setting.controller';
import { Setting, SettingSchema } from './schemas/setting.schema';
import { SettingService } from './services/setting.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Setting.name, schema: SettingSchema }]),
    forwardRef(() => GameModule),
  ],
  controllers: [SettingController],
  providers: [SettingService],
  exports: [SettingService],
})
export class SettingModule {}
