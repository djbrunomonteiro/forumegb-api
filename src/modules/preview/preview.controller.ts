import { Controller, Post, Body, UseInterceptors, UploadedFile, Get, Query, Res, BadRequestException} from '@nestjs/common';
import { PreviewService } from './preview.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('preview')
export class PreviewController {
  constructor(private readonly previewService: PreviewService) {}
  @Post('')
  @UseInterceptors(FileInterceptor('file'),) 
  create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const {start, end} = body
    return this.previewService.create(file, start, end);
  }

  @Get('')
  async getPreview(@Query('id') id, @Res() res: Response) {

    try {
      const audioStream = await this.previewService.getOne(id);
      res.set({
        'Content-Type': 'audio/mpeg', // ou o tipo MIME correto do seu arquivo
        'Content-Disposition': `attachment; filename="${id}.mp3"` // Ajuste o nome do arquivo se necessário
      });

      return audioStream.pipe(res);

    } catch (error) {
      const response = { error: true, results: undefined, message: error.message };
      throw new BadRequestException(response);
    }

  }

}
