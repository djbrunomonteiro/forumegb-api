import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PostModule } from './modules/post/post.module';
import { PreviewModule } from './modules/preview/preview.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { existsSync, mkdirSync } from 'fs';
import { PaymentModule } from './modules/payment/payment.module';
const uploadDir = join(__dirname, '../uploads');




if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: 3306,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    UserModule,
    JwtModule,
    PostModule,
    PreviewModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..'),
    }),
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useValue: FileInterceptor('file', {
        storage: diskStorage({
          destination: uploadDir, // Use a variável uploadDir
          filename: (req, file, cb) => {
            const fileName = `${Date.now()}-${file.originalname}`;
            cb(null, fileName);
          },
        }),
      }),
    },
  ],
})
export class AppModule {}
