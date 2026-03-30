import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

export interface AuthConfig {
  jwt: {
    secret: string;
    signOptions: {
      expiresIn: StringValue;
    };
  };
  refreshToken: {
    expiresIn: string;
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
    refreshToken: {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY!,
    },
  }),
);
