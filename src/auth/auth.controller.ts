import {
  Controller,
  Post,
  Body,
  Patch,
  HttpCode,
  UseGuards,
  Param,
  Req,
  Res,
  BadRequestException,
  Get,
  Headers,
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
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { PasswordResetsDto } from './dto/password-resets.dto';
import { RefreshGuard } from './guard/refresh.guard';
import { CurrentSession } from './decorators/current-session.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  register(@Req() req: Request, @Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto, {
      url: `${req.protocol}://${req.get('host')}/api/v1/email-verification`,
    });
  }

  @Post('/login')
  @HttpCode(200)
  async login(
    @Headers('x-client-type') clientType: string,
    @Res({ passthrough: true })
    res: Response,
    @Req() req: Request,
    @UserMeta() meta: TypeUserMeta,
    @Body() loginUserDto: LoginUserDto,
  ) {
    const { user, publications, accessToken, refreshToken } =
      await this.authService.login(meta, loginUserDto, { url: req.url });

    if (clientType !== 'mobile') {
      res.cookie('accessToken', accessToken, accessTokenCookieOptions);
      res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
      return { user, publications };
    }

    return { user, publications, accessToken, refreshToken };

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
  @UseGuards(RefreshGuard)
  async changePassword(
    @Headers('x-client-type') clientType: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
    @CurrentUser() user: User,
    @UserMeta() meta: TypeUserMeta,
    @CurrentSession()
    sessions: {
      selector: string;
      verifier: string;
      hashedVerifier: string;
    },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    function clearCookies() {
      res.clearCookie('accessToken', accessTokenCookieOptions);
      res.clearCookie('refreshToken', refreshTokenCookieOptions);
    }
    const { accessToken, refreshToken } = await this.authService.changePassword(
      { userId: user.id, email: user.email },
      changePasswordDto,
      meta,
      { url: req.url, email: user.email },
      {
        ...sessions,
      },
      clearCookies,
    );

    if (clientType !== 'mobile') {
      res.cookie('accessToken', accessToken, accessTokenCookieOptions);
      res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
    }
    return { accessToken, refreshToken };
  }

  @Post('/forgot-password')
  @HttpCode(204)
  async forgotPassword(
    @Req() req: Request,
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ) {
    const url = `${req.protocol}://${req.get('host')}/api/v1/auth/password-resets/`;

    await this.authService.forgotPassword(forgotPasswordDto, { baseUrl: url });
  }

  @Get('/password-resets/:token')
  async verifyPasswordResetsToken(
    @Req() req: Request,
    @Param('token') token: string,
  ) {
    await this.authService.verifyPasswordRestsToken(token, { url: req.url });
    return { message: 'Password resets token is valid' };
  }

  @Patch('/password-resets/:token')
  @HttpCode(204)
  async passwordRests(
    @Req() req: Request,
    @Param('token') token: string,
    @Body() passwordResetDto: PasswordResetsDto,
  ) {
    if (!token) {
      throw new BadRequestException('Password rests token is required');
    }
    await this.authService.resetsPassword(passwordResetDto, token, {
      url: req.url,
    });
  }

  @Post('/email-verification')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async emailVerification(@Req() req: Request, @CurrentUser() user: User) {
    await this.authService.sendVerifyEmail(user, {
      url: `${req.protocol}://${req.get('host')}/api/v1/email-verification`,
    });
  }

  @Patch('/email-verification/:token')
  @HttpCode(204)
  async verifyEmail(@Param('token') token: string) {
    await this.authService.verifyEmail(token);
  }

  @Post('/refresh-token')
  @UseGuards(RefreshGuard)
  async refreshToken(
    @Headers('x-client-type') clientType: string,
    @Res({ passthrough: true }) res: Response,
    @UserMeta() meta: TypeUserMeta,
    @CurrentSession()
    sessions: {
      selector: string;
      verifier: string;
      hashedVerifier: string;
    },
  ) {
    function clearCookies() {
      res.clearCookie('accessToken', accessTokenCookieOptions);
      res.clearCookie('refreshToken', refreshTokenCookieOptions);
    }

    const { accessToken, refreshToken } =
      await this.authService.refreshRotation(
        {
          ...sessions,
          userMeta: meta,
        },
        clearCookies,
      );

    if (clientType !== 'mobile') {
      res.cookie('accessToken', accessToken, accessTokenCookieOptions);
      res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
    }
    return { accessToken, refreshToken };
  }

  @Post('/logout')
  @HttpCode(204)
  async logout(
    @Headers('x-client-type') clientType: string,
    @Req() req: Request,
    @Res({ passthrough: true })
    res: Response,
    @Body() refreshToken?: string,
  ) {
    const token =
      clientType === 'mobile'
        ? refreshToken
        : (req.cookies['refreshToken'] as string);

    if (token) {
      const [selector] = token.split('.');
      await this.authService.logout(selector);
    }

    res.clearCookie('accessToken', accessTokenCookieOptions);
    res.clearCookie('refreshToken', refreshTokenCookieOptions);
  }
}
