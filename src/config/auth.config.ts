import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

export interface AuthConfig {
  jwt: {
    secret: string;
    signOptions: {
      expiresIn: StringValue;
    };
  };
  tokensExpiry: {
    refreshTokenExpiry: StringValue;
    passwordResetsTokenExpiry: StringValue;
    emailVerificationTokenExpiry: StringValue;
  };
}

export const jwtConfig = registerAs(
  'auth',
  (): AuthConfig => ({
    jwt: {
      secret: process.env.JWT_SECRET!,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRY as StringValue,
      },
    },
    tokensExpiry: {
      refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY as StringValue,
      passwordResetsTokenExpiry: process.env
        .PASSWORD_RESET_TOKEN_EXPIRY as StringValue,
      emailVerificationTokenExpiry: process.env
        .EMAIL_VERIFICATION_TOKEN_EXPIRY as StringValue,
    },
  }),
);
