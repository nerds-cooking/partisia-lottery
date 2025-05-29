import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingModule } from 'src/settings/setting.module';
import { UserModule } from '../users/user.module';
import { GameController } from './controllers/game.controller';
import { Game, GameSchema } from './schemas/game.schema';
import { GameService } from './services/game.service';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([{ name: Game.name, schema: GameSchema }]),
    forwardRef(() => SettingModule),
  ],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
