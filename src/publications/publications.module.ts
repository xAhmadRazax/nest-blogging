import { Logger, Module } from '@nestjs/common';
import { PublicationsService } from './publications.service';
import { PublicationsController } from './publications.controller';
import { MembershipService } from './membership.service';
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { PublicationsHistoryService } from './publicationsHistory.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [PublicationsController],
  providers: [
    PublicationsService,
    PublicationsHistoryService,
    MembershipService,
    RolesService,
    PermissionsService,
    Logger,
  ],
})
export class PublicationsModule {}
