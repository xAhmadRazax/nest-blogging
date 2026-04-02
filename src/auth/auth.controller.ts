import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UserMeta } from './decorators/user-meta.decorator';
import type { TypeUserMeta } from './types/auth.type';
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from './constants/cookie.options';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorators';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { User } from 'src/db/schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('/login')
  @HttpCode(200)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @UserMeta() meta: TypeUserMeta,
    @Body() loginUserDto: LoginUserDto,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.login(
      meta,
      loginUserDto,
      { url: req.url },
    );

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
    return { user, accessToken, refreshToken };
    // user response
    /*{
  accessToken: "jwt-token",
  
  user: {
    id: "user-id",
    username: "gintoki",
    email: "gintoki@mail.com"
  },

  organizations: [
    {
      id: "org-1",
      name: "Anthropy",
      role: "owner",
      permissions: ["delete_post", "publish_post", "manage_members"]
    },
    {
      id: "org-2",
      name: "OpenBlog",
      role: "member",
      permissions: ["create_post"]
    }
  ]
} */
  }

  @Patch('/change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @CurrentUser() user: User,
    @UserMeta() meta: TypeUserMeta,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const { accessToken, refreshToken } = await this.authService.changePassword(
      { userId: user.id, email: user.email },
      changePasswordDto,
      meta,
      { url: req.url },
    );

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    return { user, accessToken, refreshToken };
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
