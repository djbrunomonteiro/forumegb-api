import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PreviewService } from './preview.service';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller('preview')
export class PreviewController {
  constructor(private readonly previewService: PreviewService) {}
  @Post('')
  @UseInterceptors(FileInterceptor('file'),) 
  create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const {start, end} = body
    return this.previewService.create(file, start, end);
  }

}
