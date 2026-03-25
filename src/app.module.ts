import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BlogsModule } from './blogs/blogs.module';

@Module({
  imports: [UsersModule, AuthModule, BlogsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
