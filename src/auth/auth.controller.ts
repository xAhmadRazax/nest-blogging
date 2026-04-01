import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpCode,
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
    @UserMeta() meta: TypeUserMeta,
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.authService.login(
      meta,
      loginUserDto,
    );

    res.cookie(accessToken, accessTokenCookieOptions);
    res.cookie(refreshToken, refreshTokenCookieOptions);
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

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
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
