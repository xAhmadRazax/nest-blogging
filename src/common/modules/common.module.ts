import { Global, Logger, Module } from '@nestjs/common';
import { TypeConfigService } from 'src/config/type.config.service';
import { EmailService } from '../services/email.service';
import { TokenService } from '../services/token.service';

@Global()
@Module({
  imports: [],
  providers: [TokenService, EmailService, TypeConfigService, Logger],
  exports: [EmailService, TokenService],
})
export class CommonModule {}
