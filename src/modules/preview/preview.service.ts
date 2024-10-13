import { BadRequestException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import ffmpegStatic from 'ffmpeg-static';
import * as path from 'path';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';
import { rejects } from 'assert';
import { Readable } from 'stream';
import { IResponse } from 'src/utils/interfaces/response';


@Injectable()
export class PreviewService {
  private drive;

  constructor() {
    ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
    this.initGoogleAPI();
  }

  // Configuração da autenticação com a Conta de Serviço
  private initGoogleAPI() {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.AGENT_GOOGLE),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    this.drive = google.drive({ version: 'v3', auth });
  }

  async create(file: any, start = 0, end = 30) {

    let response: IResponse;

    try {
      const [name,_] = String(file.originalname).split('.mp3') 
      const customFileName = `${this.generateName(name ?? 'previewfile')}.mp3`;

      const inputPath = await this.setLocale(file, customFileName);
      const {buffer, outputPath} = await this.cutFile(inputPath, customFileName, start, end);
      const fileMetadata = {
        name: customFileName, // Nome do arquivo
        mimeType: file.mimetype, // Tipo MIME do arquivo
        parents: ['1HZ7N2VnlAFOcI4Uc4WTvoDKx4w-QvGAh'], // Adiciona a ID da pasta como pai
      };

      const fileStream = new Readable();
      fileStream.push(buffer);
      fileStream.push(null);


      const media = {
        mimeType: 'audio/mpeg',
        body: fileStream
      };

      const resUpload = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      console.log(resUpload);
      
      this.removeLocalePreview([inputPath,outputPath]);
      response = {error: false, results: resUpload?.data, message: 'operação realizada com sucesso!'};

      return response;

  

      
    } catch (error) {
      response = {error: true, results: error, message: 'ocorreu um error ao processar operação!'}
      throw new BadRequestException(response);
    }
  }


  removeLocalePreview(paths: string[]){

    for (let index = 0; index < paths.length; index++) {
      const path = paths[index];

      fs.unlink(path, (err) => {
        if (err) {
          console.error('Erro ao deletar o arquivo:', err);
          return;
        }
        console.log('Arquivo deletado com sucesso!');
      });
      
    }

  }

  setLocale(file: any, customFileName: string){
    return new Promise<string>((resolve, reject) => {
      const uploadsPath = path.join(process.cwd(), 'uploads');

      const filePath = path.join(uploadsPath, customFileName);
      const ws = fs.createWriteStream(filePath);
      ws.write(file.buffer, (err) => {
        if (err) {
          console.error('Error writing file:', err);
          reject(undefined)
          return;
        }
        console.log(`File saved as ${filePath}`);
        resolve(filePath)
      });
  
      // Finalize o WriteStream
      ws.end();

    })
  }

  cutFile(filePath: string, name: string, start = 0, end = 30){
  const uploadsPath = path.join(process.cwd(), 'uploads');
  const outputPath = path.join(uploadsPath, `preview-${name}.mp3`);

  return new Promise<any>((resolve, reject) => {
    ffmpeg(filePath)
      .setStartTime(start)
      .setDuration(end - start)
      .output(outputPath)
      .on('end', async () => {
        const readStream = fs.createReadStream(outputPath);
        const buffer = await this.streamToBuffer(readStream)
        resolve({buffer, outputPath})
      })
      .on('error', (err) => {
        console.error(err);
        reject(err);
      })
      .run();
  });

  }

  streamToBuffer(readStream) {
    const chunks = [];
  
    return new Promise((resolve, reject) => {
      readStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
  
      readStream.on('end', () => {
        // Cria um Buffer a partir dos chunks coletados
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
  
      readStream.on('error', (err) => {
        reject(err);
      });
    });
  }

  generateName(name: string, pre = '') {
    return name
      .replace(/\s+/g, '_') // Substitui todos os espaços por '_'
      .toLowerCase();       // Converte para letras minúsculas
  }



}
