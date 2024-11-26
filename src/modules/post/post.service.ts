import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { IResponse } from 'src/utils/interfaces/response';
import { CreatePostDto } from './dto/create-post.dto';
import { concatMap, firstValueFrom, from, map, mergeMap, Observable, throwError, toArray } from 'rxjs';
import { ETypeStage } from 'src/utils/enums/enums';
import { UserService } from '../user/user.service';
import { PreviewService } from '../preview/preview.service';
import { file } from 'googleapis/build/src/apis/file';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');



@Injectable()
export class PostService {

  introducoes = [
    "Se liga nessa playlist que estamos disponibilizando, e não esquece de deixar seu comentário!",
    "Aproveite essa playlist incrível que preparamos para você e compartilhe o que achou!",
    "Curta essa playlist que criamos especialmente para você, e deixe seu comentário abaixo!",
    "Essa playlist está imperdível! Ouça agora e conte para a gente o que achou!",
    "Preparamos uma playlist especial para você! Não esqueça de comentar o que achou!",
    "Se liga nessa seleção musical que trouxemos! Adoraríamos saber sua opinião nos comentários.",
    "Essa playlist foi feita com muito carinho! Comente e diga o que achou das músicas!",
    "Ouça agora essa playlist incrível e não se esqueça de compartilhar seu feedback com a gente!",
    "Dá um play nessa playlist e depois conta nos comentários qual música você mais gostou!",
    "Essa playlist está demais! Comente o que achou e compartilhe com seus amigos!",
    "Ouça essa seleção que preparamos para você e deixe sua opinião nos comentários!",
    "Se liga nessa playlist e aproveite o melhor da música! Não esqueça de deixar um comentário!",
    "Dê um play nessa playlist incrível e conte pra gente o que achou nos comentários!",
    "Essa playlist está cheia de músicas incríveis! Queremos saber sua opinião nos comentários.",
    "Preparamos uma playlist para você curtir! Comente e diga o que achou das músicas!",
    "Dá um play nessa playlist e depois compartilhe sua opinião com a gente nos comentários!",
    "Essa seleção de músicas foi feita especialmente para você! Comente o que achou!",
    "Curta essa playlist e não esqueça de nos contar o que achou nos comentários!",
    "Aproveite essa playlist especial que criamos e não deixe de comentar!",
    "Dê um play nessa playlist incrível e compartilhe sua opinião nos comentários!"
  ];

  interetor = 0;

  


  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    private userService: UserService,
    private previewService: PreviewService,
  ) {
    dayjs.extend(utc);
    dayjs.extend(timezone);
  }

  async generatePostsFolderFromDrive(folderId: string){
    if(!folderId){return 'empty'}
    try {
      const resListFolder = await this.previewService.listFolders(folderId);
      let folders = resListFolder?.data?.files as any[];
      if(!folders.length){return 'empty'}

      folders.sort((a, b) => a.name - b.name);

      from(folders).pipe(
        concatMap(async (folder) => {
          const resSave = await this.processPostFolder(folder.id, String(folder.name))
          return {...resSave, results: {id: resSave?.results?.id, source_url: resSave?.results?.source_url}}
        }),
        toArray()
      ).subscribe((res) => {
        console.log(res);
      });
      return 'ok'

    } catch (error) {
      return new BadRequestException(error);
    }

  }

  async generatePostsFileFromDrive(folderId: string){
    if(!folderId){return 'empty'}
    try {
      const list = await this.previewService.listFilesInFolder(folderId);
      const files = list?.data?.files as any[];
      if(!files.length){return 'empty'}

      from(files).pipe(
        concatMap(async (file) => {
          const resSave = await this.processPostFile(file.id, file.name)
          return {...resSave, results: {id: resSave?.results?.id, source_url: resSave?.results?.source_url}}
        }),
        toArray()
      ).subscribe((res) => {
        console.log(res);
        
      });
      return 'ok'

    } catch (error) {
      return new BadRequestException(error);
    }

  }

  

  private async processPostFolder(folderId, folderName){

    const res = await this.previewService.listFilesInFolder(folderId);
    const files = res?.data?.files as any[];

    const parags = files.map(elem => {
      const {name} = elem;
      return `<li>${name}</li>`
    }).reduce((prev, curr) => prev += curr, '')
    
    const randomIndex = Math.floor(Math.random() * this.introducoes.length);

    const slug = String(folderName).toLowerCase() // Converte para minúsculas
      .normalize("NFD") // Normaliza caracteres especiais
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres não alfanuméricos
      .trim() // Remove espaços no início e no fim
      .replace(/\s+/g, "-"); // Substitui espaços por '-'

    const post: CreatePostDto = {
      owner_id: 1,
      title: `${folderName}`,
      slug: `${slug}-${Date.now()}`,
      body: `<p>${this.introducoes[randomIndex]}:</p><ul> ${parags} </ul>`,
      type_stage: 'MAINSTAGE',
      source_url: `https://drive.google.com/drive/folders/${folderId}`
    }

    return await this.create(post)
  }

  private async processPostFile(fileId, fileName){
    const slug = String(fileName).toLowerCase() // Converte para minúsculas
      .normalize("NFD") // Normaliza caracteres especiais
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres não alfanuméricos
      .trim() // Remove espaços no início e no fim
      .replace(/\s+/g, "-"); // Substitui espaços por '-'

    const post: CreatePostDto = {
      owner_id: 1,
      title: `${fileName}`,
      slug: `${slug}-${Date.now()}`,
      body: `<p>Deixe seu comentário sobre essa track!</p>`,
      type_stage: 'MAINSTAGE',
      source_url: `https://drive.google.com/file/d/${fileId}/view`
    }

    return await this.create(post)
  }

  async like(idPost: any, idUser: any){
    let response: IResponse;

    try {
      if(!idPost || !idUser){
        throw new BadRequestException('idPost | idUser undefined')
      }

      const postRef = await this.postRepository.findOne({where: {id: +idPost}});

      if(!postRef){
        throw new BadRequestException('postRef undefined')
      }

      const date = dayjs().tz('America/Sao_Paulo').format();

      let likeItem = {id_user: +idUser, date}
      let likes = [];
      likes = JSON.parse(postRef.likes) as any[] ?? [];

      if(postRef.likes){
        const indexRef = likes.findIndex(elem => +elem.id_user === likeItem.id_user);
        if(indexRef === -1){
          likes.push(likeItem)
        }else{
          likes.splice(indexRef, 1);
        }

      }else{
        likes.push(likeItem)
      }

      await this.postRepository.update(postRef.id, {likes: JSON.stringify(likes)});

      const results = {...postRef, likes}

      response = {
        error: false,
        results,
        message: 'operação realizada com sucesso.',
      };

      return response


    } catch (error) {
        response = {
        error: true,
        results: error?.message,
        message: 'falha ao realizar operação',
      };
      throw new BadRequestException(response)
    }

  }
  
  async create(createPostDto: CreatePostDto, fatherId?: string) {
    let response: IResponse;
    try {
      delete createPostDto.id;

      // Obter o usuário
      const user = await this.userService.findOneById(createPostDto.owner_id);
      if (!user) {
          throw new BadRequestException('Usuário não encontrado.');
      }


      let results = await this.postRepository.save({...createPostDto, owner_username: user.displayName, user});
 
      if(fatherId){
        const resQuery = await this.findOne(fatherId);
        if(!resQuery.error){
          results = resQuery.results;
        }
      }

      response = {
        error: false,
        results,
        message: 'operação realizada com sucesso.',
      };
      return response;
    } catch (error) {
      response = {
        error: true,
        results: error?.message,
        message: 'falha ao realizar operação',
      };
      throw new BadRequestException(response)
    }
  }

  async recordsTotal(type?: string){
    let response: IResponse;
    try {
      const where = ETypeStage[type] ? `post.parent_id IS NULL AND post.type_stage = '${type}'` : 'post.parent_id IS NULL'
      const recordsTotal = await this.postRepository
        .createQueryBuilder('post')
        .where(where)
        .getCount();

      response = {
        error: false,
        results: {recordsTotal},
        message: 'operação realizada com sucesso.',
      };
      return response;
      
    } catch (error) {
      response = {
        error: true,
        results: error?.message,
        message: 'falha ao realizar operação',
      };
      return response;
    }

  }

  async findAll(type = '', start = 1, limit = 200, typeOrder = 'recentes') {
    let response: IResponse;
    try {
      const results = await this.getPostsWithChildren(type, start, limit, typeOrder);
      response = {
        error: false,
        results,
        message: 'operação realizada com sucesso.',
      };
      return response;
    } catch (error) {
      response = {
        error: true,
        results: error?.message,
        message: 'falha ao realizar operação',
      };
      throw new BadRequestException(response)
    }

  }

  async resumeHome() {
    let response: IResponse;
    try {

      let types = [ETypeStage.MAINSTAGE, ETypeStage.FLOORSTAGE, ETypeStage.BACKSTAGE];

      const groups$ = from(types).pipe(
        mergeMap(async (type) => {
          let posts = await this.getPostsWithChildren(type, 0, 5);
          posts = posts.map(post => {
            delete post.body;
            delete post.source_url;
            return post
          });


          const countPosts = await this.postRepository.count({where: {parent_id: IsNull(), type_stage: type}});
          const countComments = await this.postRepository.count({where: {parent_id: Not(IsNull()), type_stage: type}});
          return {type_stage: type, posts, countPosts, countComments}
        }),
        toArray()
      )

      const results = await firstValueFrom(groups$);

      response = {
        error: false,
        results,
        message: 'operação realizada com sucesso.',
      };
      return response;
    } catch (error) {
      console.log(error);
      
      response = {
        error: true,
        results: error?.message,
        message: 'falha ao realizar operação',
      };
      throw new BadRequestException(response)
    }

  }

  sortById(posts: CreatePostDto[]){
    return posts.sort((a, b) => a.id - b.id);
  }

  async getPostsWithChildren(type = '', start = 0, limit = 50, typeOrder = 'recentes') {

    let where;
    let sort;
    let order;
    if (type in ETypeStage) {
      where = `post.parent_id IS NULL AND post.type_stage = '${type}'`;
    } else {
      where = 'post.parent_id IS NULL' 
    }

    sort = 'post.created_at';
    order = 'DESC'

    try {

      // Primeiro, busca os posts pais
      let parents = await this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'users')  // Join com a tabela users utilizando owner_id
      .where(where)
      .orderBy(sort, order)  // Ordena pelos itens mais recentes
      .limit(limit)          // Limita ao número de itens por página
      .offset(start) 
      .select([
          'post',                  // Seleciona todos os campos do post
          'users.photoURL',        // Corrige o alias para 'users'
          'users.social_links',     // Corrige o alias para 'users'
          'users.permission',       // Corrige o alias para 'users'
      ])
      .getMany() as CreatePostDto[];


      const results$ = from(parents).pipe(
        mergeMap(async parent => {
          let children = await this.postRepository.createQueryBuilder('post')
          .leftJoinAndSelect('post.user', 'users')  // Faz o join com a tabela de usuários
          .where('post.parent_id = :parentId', { parentId: parent.id })
          .select([
              'post',                  // Seleciona todos os campos do post
              'users.photoURL',        // Corrigido para usar o alias 'users'
              'users.social_links',     // Corrigido para usar o alias 'users'
              'users.permission',       // Corrigido para usar o alias 'users'
          ])
          .getMany() as CreatePostDto[];

        if(!children.length){
          return parent
        }

        children = await firstValueFrom(this.getChildren(children, parent.id)) 
        return {...parent, children}
        }),
        toArray(),
        map(items => items.sort((a, b) => b.id - a.id))
      )


      return firstValueFrom(results$)
      
    } catch (error) {
      console.log(error);
      
      throw new BadRequestException(error)
    }



  }
  

  // Função recursiva para buscar os filhos
  getChildren(posts: CreatePostDto[], parentId: number): Observable<CreatePostDto[]> {
    return from(posts).pipe(
        concatMap(post => {
            return this.postRepository.createQueryBuilder('post')
                .leftJoinAndSelect('post.user', 'user') // Faz o join com a tabela de usuários
                .where('post.parent_id = :parentId', { parentId: post.id })
                .select([
                    'post',                  // Seleciona todos os campos do post
                    'user.displayName',        
                    'user.photoURL',        // Seleciona a imagem do usuário
                    'user.social_links',     // Seleciona os links sociais do usuário
                    'user.permission',       // Seleciona a permissão do usuário
                ])
                .getMany()
                .then(async children => {
                    if (!children.length) {
                        return post;
                    }
                    // Busca recursivamente os filhos do filho
                    const grandChildren = await firstValueFrom(this.getChildren(children, post.id));
                    return { ...post, children: grandChildren };
                });
        }),
        toArray()
    );
  }


  async findOne(param: string): Promise<IResponse> {
    let response: IResponse;
    let results;
    
    try {
        const query = isNaN(+param) ? { slug: param } : { id: +param };

        // Usa o QueryBuilder para buscar o post e o usuário associado
        const parent = await this.postRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.user', 'user') // Faz o join com a tabela de usuários
            .where(query)
            .select([
                'post',                  // Seleciona todos os campos do post
                'user.displayName',        
                'user.photoURL',        // Seleciona a imagem do usuário
                'user.social_links',     // Seleciona os links sociais do usuário
                'user.permission',       // Seleciona a permissão do usuário
            ])
            .getOne() as CreatePostDto;

        if (!parent) {
            throw new Error('Post não encontrado');
        }

        results = parent;

        // Busca os filhos usando QueryBuilder
        let children = await this.postRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.user', 'user') // Faz o join com a tabela de usuários
            .where('post.parent_id = :parentId', { parentId: parent.id })
            .select([
                'post',
                'user.displayName',        
                'user.photoURL',        // Seleciona a imagem do usuário
                'user.social_links',     // Seleciona os links sociais do usuário
                'user.permission',       // Seleciona a permissão do usuário
            ])
            .getMany() as CreatePostDto[];

        if (children.length) {
            children = await firstValueFrom(this.getChildren(children, parent.id));
            results = { ...parent, children };
        }

        response = {
            error: false,
            results,
            message: 'Operação realizada com sucesso.',
        };
        
        return response;
    } catch (error) {
        response = {
            error: true,
            results: error?.message,
            message: 'Falha ao realizar operação',
        };
        
        return response;
    }
}


  async update(id: number, updatePostDto: UpdatePostDto) {
    let response: IResponse;
    try {
      const results = await this.postRepository.update(id, updatePostDto);
      response = {
        error: false,
        results: updatePostDto,
        message: 'operação realizada com sucesso.',
      };
      return response;
    } catch (error) {
      response = {
        error: true,
        results: error?.message,
        message: 'falha ao realizar operação',
      };

      console.log(error);
      
      throw new BadRequestException(response)
    }
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }

  async isAuthor(slug: string, owner_id: number){
    const isOwner = await this.postRepository.existsBy({ slug, owner_id });
    return {
      error: false,
      results: {isOwner},
      message: isOwner ? 'Permitido para o author!' : 'Não permitido, você não é o author!',
    };;
  }
}
