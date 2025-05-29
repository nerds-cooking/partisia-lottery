import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../users/user.module';
import { validationSchema } from './config/validation';

import { Logger } from '@nestjs/common';
import { GameModule } from 'src/game/game.module';
import { CsrfMiddleware } from 'src/middleware/csrf.middleware';
import { SettingModule } from 'src/settings/setting.module';
import { AppController } from './controllers/app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI', { infer: true });

        Logger.log(`MongoDB URI: ${uri}`, 'MongoDB Connection');

        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
    forwardRef(() => SettingModule),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => GameModule),
  ],
  controllers: [AppController],
  providers: [CsrfMiddleware],
})
export class AppModule {}
