import { Controller, Get } from '@nestjs/common';
import { SettingService } from '../services/setting.service';

@Controller('setting')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('/')
  getSettings() {
    return this.settingService.findAll();
  }
}
