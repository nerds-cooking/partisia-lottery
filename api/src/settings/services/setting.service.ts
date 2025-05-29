import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting } from '../schemas/setting.schema';

@Injectable()
export class SettingService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<Setting>,
  ) {}

  async findAll(): Promise<Setting[]> {
    return this.settingModel.find().exec();
  }
}
