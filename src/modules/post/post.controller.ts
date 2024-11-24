import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

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
    const idUser = body?.idUser
    return this.postService.like(idPost, idUser);
  }

  @Get()
  findAll(@Query('type') type: string, @Query('start') start: number, @Query('limit') limit: number, @Query('order') order: string) {
    return this.postService.findAll(type, start, limit, order);
  }

  @Get('home')
  resumeHome() {
    return this.postService.resumeHome();
  }

  @Get(':slug/author/:id')
  isAuthor(@Param('slug') slug: string, @Param('id') id: string) {
    return this.postService.isAuthor(slug, +id);
  }

  
  @Get('total')
  recordsTotal() {
    return this.postService.recordsTotal();
  }

  @Get('search')
  findOne(@Query('slug') slug: string) {
    return this.postService.findOne(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
}
