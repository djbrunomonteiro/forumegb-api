import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PostEntity } from './entities/post.entity';
import { UserModule } from '../user/user.module';
import { PreviewModule } from '../preview/preview.module';

@Module({
  controllers: [PostController],
  providers: [PostService],
  imports: [
    TypeOrmModule.forFeature([PostEntity]),
    JwtModule,
    UserModule,
    PreviewModule
  ]
})
export class PostModule {}
