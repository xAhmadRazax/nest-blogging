import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BlogsModule } from './blogs/blogs.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { ConfigModule } from '@nestjs/config';
import { jwtConfig } from './config/auth.config';
import { DbModule } from './db/db.module';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { DB_PROVIDER } from './db/db.provider';
import { appConfigSchema } from './config/config.types';
import { JwtExceptionFilter } from './filters/jwt.exception.filter';
import { DrizzleExceptionFilter } from './filters/drizzle.exception.filter';
import { ZodExceptionFilter } from './filters/zod.exception.filter';
import { emailConfig } from './config/email.config';
import { PublicationsModule } from './publications/publications.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, emailConfig],
      validationSchema: appConfigSchema,
    }),
    DbModule,
    ClsModule.forRoot({
      global: true,
      plugins: [
        new ClsPluginTransactional({
          imports: [DbModule],
          adapter: new TransactionalAdapterDrizzleOrm({
            drizzleInstanceToken: DB_PROVIDER,
          }),
        }),
      ],
    }),
    UsersModule,
    AuthModule,
    BlogsModule,
    PublicationsModule,
    PostsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ZodExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: JwtExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DrizzleExceptionFilter,
    },
  ],
})
export class AppModule {}
