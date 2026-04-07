import { Global, Logger, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { TypeConfigService } from 'src/config/type.config.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [EmailService, TypeConfigService, Logger],
  exports: [EmailService],
})
export class EmailModule {}
