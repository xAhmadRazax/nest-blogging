import { Injectable } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { PayloadType } from 'src/common/types/jwtPayload';

@Injectable()
export class TokenService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}
  generateJwtToken({ userId, email }: { userId: string; email: string }) {
    // here i dont need to pass the secret or expirey as im suing configuring it
    // using the nest config inside the auth module
    return this.jwtService.sign({ sub: userId, email });
  }

  decodeJwtToken(token: string, verifyToken: boolean = true): PayloadType {
    if (verifyToken) {
      return this.verifyJwtToken(token) as PayloadType;
    }
    return this.jwtService.decode<PayloadType>(token);
  }

  generateRefreshTokenPair() {
    const selector = this.hashingService.generateCryptoToken({
      byteLength: 16,
    });
    const verifier = this.hashingService.generateCryptoToken();
    const hashedVerifier = this.hashingService.encryptCryptoToken(verifier);

    return {
      selector,
      verifier,
      hashedVerifier,
    };
  }

  private verifyJwtToken(token: string) {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
