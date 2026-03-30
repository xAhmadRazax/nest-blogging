import { UnauthorizedException } from '@nestjs/common';
import { HashingService } from './hashing.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
export class TokenService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}
  private generateJwtToken(userId: string) {
    // here i dont need to pass the secret or expirey as im suing configuring it
    // using the nest config inside the auth module
    return this.jwtService.sign({ userId });
  }

  private verifyJwtToken(token: string) {
    return this.jwtService.verify<JwtPayload>(token);
  }

  private decodeJwtTOken(token: string) {
    return this.jwtService.decode<JwtPayload>(token);
  }

  private refreshTokenPair() {
    const selector = this.hashingService.generateCryptoToken({
      generateUUID: true,
    });
    const verifier = this.hashingService.generateCryptoToken();
    const hashedVerifier = this.hashingService.encryptCryptoToken(verifier);

    return {
      selector,
      verifier,
      hashedVerifier,
    };
  }
}
