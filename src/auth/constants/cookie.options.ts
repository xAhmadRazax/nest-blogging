// src/auth/constants/cookie.options.ts
import { CookieOptions } from 'express';
import ms, { StringValue } from 'ms';

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'prod',
  sameSite: 'strict',
  maxAge:
    Date.now() +
    +ms(process.env.REFRESH_TOKEN_EXPIRY?.toLocaleLowerCase() as StringValue),
  //   path: '/auth/refresh', // only sent on refresh endpoint
};

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'prod',
  sameSite: 'strict',
  maxAge:
    Date.now() +
    +ms(process.env.JWT_EXPIRY?.toLocaleLowerCase() as StringValue),
  //   path: '/auth/refresh', // only sent on refresh endpoint
};
