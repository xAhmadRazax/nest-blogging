import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
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
import { userInfo } from 'os';

@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Post('/')
  @UseGuards(AuthGuard, IsUserVerifiedGuard)
  async create(
    @CurrentUser() user: PublicUser,
    @Body()
    createPublicationDto: CreatePublicationDto,
  ) {
    await this.publicationsService.create(user.id, createPublicationDto);
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
}
