import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import { Types } from 'mongoose';
import { partisiaCrypto } from 'partisia-blockchain-applications-crypto';
import { UserService } from '../../users/services/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async generateNonce(pubKey: string) {
    // Derive address from public key
    const address = partisiaCrypto.wallet.publicKeyToAddress(pubKey);

    const nonce = randomBytes(16).toString('hex');

    // Create user if not exists
    await this.userService.findOrCreate(address, pubKey);

    await this.userService.upsertNonce(address, nonce);
    return { message: `Sign this message to authenticate: ${nonce}` };
  }

  async verifySignature(
    {
      address,
      signature,
      message: _message,
    }: {
      address: string;
      signature: string;
      message?: string;
    },
    req: Request,
  ) {
    const user = await this.userService.findByAddress(address);
    if (!user || !user.publicKey) {
      throw new Error('User not found or public key missing');
    }

    if (signature.length !== 130) {
      throw new Error(`Invalid signature length: ${signature.length}`);
    }

    const message =
      _message || `Sign this message to authenticate: ${user.nonce}`;

    // Load chain ID from config when we store this
    const chainId = 'Partisia Blockchain Testnet';
    const digest = partisiaCrypto.transaction.deriveDigest(
      chainId,
      Buffer.from(message, 'utf8'),
    );

    const isValid = partisiaCrypto.wallet.verifySignature(
      digest,
      signature,
      user.publicKey,
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    req.session.user = {
      address: user.address,
      id: (user._id as Types.ObjectId).toString(),
    };
  }
}
