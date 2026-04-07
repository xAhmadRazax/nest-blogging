import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeConfigService } from 'src/config/type.config.service';
import { TokenService } from './token.service';
import { HashingService } from './hashing.service';
import { SessionService } from './session.service';
import { PasswordResetsService } from './password-resets.service';
import { EmailModule } from 'src/email/email.module';
import { EmailVerificationsService } from './email-verification.service';

@Module({
  imports: [
    // configuring our jwt so i can later use it without manually adding expiry and secret
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: TypeConfigService) => ({
        ...configService.get('auth', { infer: true })?.jwt,
      }),
    }),
    UsersModule,
    EmailModule,
  ],
  providers: [
    AuthService,
    TokenService,
    HashingService,
    SessionService,
    PasswordResetsService,
    EmailVerificationsService,
    TypeConfigService,
    Logger,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
