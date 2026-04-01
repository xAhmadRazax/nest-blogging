import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export const UserMeta = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ??
      request.ip ??
      request.socket?.remoteAddress ??
      null;

    const parser = new UAParser(request.headers['user-agent'] ?? '');
    const ua = parser.getResult();

    return {
      ipAddress: ip,
      device: {
        browser: ua.browser.name ?? null,
        os: ua.os.name ?? null,
        platform: ua.device.type ?? 'desktop',
      },
    };
  },
);
