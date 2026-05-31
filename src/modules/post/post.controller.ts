import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from 'src/utils/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { join } from 'path';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          const fileName = `${Date.now()}-${file.originalname}`;
          cb(null, fileName);
        },
      }),
    }),
  )
  uploadThumbnail(@UploadedFile() file: any, @Req() req: Request) {
    return this.postService.uploadThumbnail(file, req);
  }

  @Post('generatefolderfromdrive')
  generatePostFolder(@Query('folderId') folderId) {
    return this.postService.generatePostsFolderFromDrive(folderId);
  }

  @Post('generatefilefromdrive')
  generatePostFileForFolder(@Query('folderId') folderId) {
    return this.postService.generatePostsFileFromDrive(folderId);
  }

  @Post()
  create(@Body() createPostDto: CreatePostDto, @Query('father') fatherId) {
    return this.postService.create(createPostDto, fatherId);
  }

  @Post('like')
  like(@Body() body: any) {
    const idPost = body?.idPost;
    const idUser = body?.idUser;
    return this.postService.like(idPost, idUser);
  }

  @Get()
  findAll(
    @Query('start') start: number,
    @Query('limit') limit: number,
    @Query('order') order: string,
  ) {
    return this.postService.findAll(start, limit, order);
  }

  @Get('home')
  resumeHome(@Query('start') start: number, @Query('limit') limit: number) {
    start = start ? +start : 0;
    limit = limit ? +limit : 50;
    return this.postService.resumeHome(start, limit);
  }

  @Get('ranking')
  getTopRanking(@Query('limit') limit: number) {
    limit = limit ? +limit : 5;
    return this.postService.getTopRanking(limit);
  }

  @UseGuards(AuthGuard)
  @Get('user/:userId/posts')
  getUserPosts(@Param('userId') userId: string) {
    return this.postService.getUserPosts(+userId);
  }

  @UseGuards(AuthGuard)
  @Get('user/:userId/comments')
  getUserComments(@Param('userId') userId: string) {
    return this.postService.getUserComments(+userId);
  }

  @UseGuards(AuthGuard)
  @Get('user/:userId/likes')
  getUserLikedPosts(@Param('userId') userId: string) {
    return this.postService.getUserLikedPosts(+userId);
  }

  @Get('summary')
  resumePost(@Query('slug') slug: string) {
    return this.postService.resumeOne(slug);
  }

  @UseGuards(AuthGuard)
  @Get('complete/:param')
  findComplete(@Param('param') param: string) {
    return this.postService.findOne(param);
  }

  @Get('query')
  search(@Query('type') type: string, @Query('term') term: string) {
    return this.postService.search(type, term);
  }

  @UseGuards(AuthGuard)
  @Get(':slug/author/:id')
  isAuthor(@Param('slug') slug: string, @Param('id') id: string) {
    return this.postService.isAuthor(slug, +id);
  }

  @Get('total')
  recordsTotal() {
    return this.postService.recordsTotal();
  }

  @UseGuards(AuthGuard)
  @Get('search')
  findOne(@Query('slug') slug: string, @Body() body: any) {
    console.log(body);
    return this.postService.findOne(slug);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(+id, updatePostDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }

  @UseGuards(AuthGuard)
  @Get('fake')
  fake() {
    return this.postService.addRoboComment();
  }
}
