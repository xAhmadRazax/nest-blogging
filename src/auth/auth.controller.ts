import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Post('/login')
  async login(@Req() req: Request, @Body() loginUserDto: LoginUserDto) {
    const user = await this.authService.login(loginUserDto);

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
