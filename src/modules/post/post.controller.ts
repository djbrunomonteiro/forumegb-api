import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto, @Query('father') fatherId) {
    return this.postService.create(createPostDto, fatherId);
  }

  @Get()
  findAll(@Query('start') start: number, @Query('limit') limit: number) {
    return this.postService.findAll(start, limit);
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
