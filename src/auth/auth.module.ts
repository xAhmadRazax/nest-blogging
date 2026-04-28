import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeConfigService } from 'src/config/type.config.service';
import { SessionService } from './session.service';
import { PasswordResetsService } from './password-resets.service';
import { EmailVerificationsService } from './email-verification.service';
import { CommonModule } from 'src/common/modules/common.module';

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
    CommonModule,
  ],
  providers: [
    AuthService,
    SessionService,
    PasswordResetsService,
    EmailVerificationsService,
    TypeConfigService,
    Logger,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
