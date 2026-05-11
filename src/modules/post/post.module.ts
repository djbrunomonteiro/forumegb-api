import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { UserModule } from '../user/user.module';
import { PreviewModule } from '../preview/preview.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [PostController],
  providers: [PostService],
  imports: [
    TypeOrmModule.forFeature([PostEntity]),
    UserModule,
    PreviewModule,
    AuthModule,
  ],
})
export class PostModule {}
