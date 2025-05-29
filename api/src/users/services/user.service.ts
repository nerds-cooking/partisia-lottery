import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByAddress(address: string) {
    return this.userModel.findOne({ address });
  }

  async findByPublicKey(publicKey: string) {
    return this.userModel.findOne({ publicKey });
  }

  async isUsernameAvailable(username: string) {
    const user = await this.userModel.findOne({
      username: {
        $regex: new RegExp(`^${username.trim()}$`, 'i'), // Case-insensitive match
      },
    });
    return !user;
  }

  async findOrCreate(address: string, publicKey: string) {
    let user = await this.userModel.findOne({ address, publicKey });
    if (!user) {
      user = new this.userModel({ address, publicKey, nonce: '' });
      await user.save();
    }
    return user;
  }

  async updateUsername(address: string, username: string) {
    if (!(await this.isUsernameAvailable(username.trim()))) {
      throw new Error('Username is already taken');
    }

    return this.userModel.findOneAndUpdate(
      { address },
      { $set: { username: username.trim() } },
    );
  }

  async upsertNonce(address: string, nonce: string) {
    return this.userModel.findOneAndUpdate(
      { address },
      { $set: { nonce } },
      { upsert: true, new: true },
    );
  }

  async findByAddresses(addresses: string[]) {
    return this.userModel.find({ address: { $in: addresses } }).exec();
  }
}
