import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { PublicationsService } from './publications.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorators';
import { type PublicUser } from 'src/db/schema';
import { IsUserVerifiedGuard } from 'src/common/guards/is_user_verified.guard';
import { PermissionGuard } from 'src/common/guards/hasPermission.guard';
import { RequirePermission } from 'src/common/decorators/required-permission.decorator';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { MemberInvitationDto } from './dto/member-invitation.dto';
import { MemberInvitationsService } from './member-invitations.service';

@Controller('publications')
export class PublicationsController {
  constructor(
    private readonly publicationsService: PublicationsService,
    private readonly memberInvitationService: MemberInvitationsService,
  ) {}

  @Post('/')
  @UseGuards(AuthGuard, IsUserVerifiedGuard)
  async create(
    @CurrentUser() user: PublicUser,
    @Body()
    createPublicationDto: CreatePublicationDto,
  ) {
    return await this.publicationsService.create(user.id, createPublicationDto);
  }

  @Get('/:slug')
  async find(@Param('slug') slug: string) {
    const record = await this.publicationsService.findOne(slug);

    return record;
  }

  @Patch('/:id')
  @UseGuards(AuthGuard, IsUserVerifiedGuard, PermissionGuard)
  @RequirePermission('publication:update')
  async update(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() updatePublicationDto: UpdatePublicationDto,
  ) {
    const record = await this.publicationsService.update(
      user.id,
      id,
      updatePublicationDto,
    );

    return record;
  }

  @Delete('/:id')
  @UseGuards(AuthGuard, IsUserVerifiedGuard, PermissionGuard)
  @RequirePermission('publication:delete')
  async delete(@Param('id') id: string) {
    await this.publicationsService.delete(id);
  }

  //  PublicationHistory

  @Get('/:id/versions')
  @UseGuards(AuthGuard, IsUserVerifiedGuard, PermissionGuard)
  @RequirePermission('publication:rollback')
  async publicationVersions(@Param('id') id: string) {
    console.log('????????????????');
    const recs = await this.publicationsService.findAllVersions(id);

    return { rollbacks: recs };
  }

  @Patch('/:id/versions/:versionId')
  @UseGuards(AuthGuard, IsUserVerifiedGuard, PermissionGuard)
  @RequirePermission('publication:rollback')
  async revertPublication(
    @CurrentUser() user: PublicUser,
    @Param() params: { id: string; versionId: string },
  ) {
    const record = await this.publicationsService.rollBackPublication({
      userId: user.id,
      publicationId: params.id,
      versionId: params.versionId,
    });

    return record;
  }

  //  memberships
  @Post('/publications/:id/invitations')
  @HttpCode(204)
  @UseGuards(AuthGuard, IsUserVerifiedGuard, PermissionGuard)
  @RequirePermission('member:invite')
  async memberInvitations(
    @CurrentUser() user: PublicUser,
    @Param('id') { id }: { id: string },
    memberInvitationDto: MemberInvitationDto,
  ) {
    await this.memberInvitationService.create({
      invitedById: user.id,
      publicationId: id,
      roleId: memberInvitationDto.roleId,
      userId: memberInvitationDto.userId,
    });
  }
  @Get('/publications/:id/invitations')
  @UseGuards(AuthGuard, IsUserVerifiedGuard, PermissionGuard)
  @RequirePermission('member:invite')
  async getAllPublicationsPendingInvitations(@Param() { id }: { id: string }) {
    const invitationsRec = await this.memberInvitationService.findMany();
  }

  @Get('/publications/:id/invitations/:token')
  @HttpCode(204)
  async checkIsMemberInvitationValid(
    @Param() { id, token }: { id: string; token: string },
  ) {
    await this.memberInvitationService.findOne(id, token);
  }
}
