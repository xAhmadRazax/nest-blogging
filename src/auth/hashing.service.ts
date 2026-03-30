import crypto from 'crypto';

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
}
