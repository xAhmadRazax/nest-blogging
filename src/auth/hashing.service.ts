import crypto from 'crypto';
import argon2 from 'argon2';
import { InternalServerErrorException } from '@nestjs/common';

export class HashingService {
  generateCryptoToken({
    generateUUID = false,
    byteLength = 32,
  }: {
    generateUUID?: boolean;
    byteLength?: number;
  } = {}): string {
    if (generateUUID) return crypto.randomUUID();
    return crypto.randomBytes(byteLength).toString('hex');
  }
  encryptCryptoToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async hashPassword(password: string) {
    try {
      const hashedPassword = await argon2.hash(password);
      return hashedPassword;
    } catch {
      throw new InternalServerErrorException('Failed to hash password');
    }
  }
  async comparePassword(candidatePassword: string, hashedPassword: string) {
    try {
      return await argon2.verify(hashedPassword, candidatePassword);
    } catch {
      throw new InternalServerErrorException('Failed to verify password');
    }
  }
}
