import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { Repository } from 'typeorm';
import { IResponse } from 'src/utils/interfaces/response';
import { CreatePostDto } from './dto/create-post.dto';
import { concatMap, firstValueFrom, from, mergeMap, Observable, toArray } from 'rxjs';
import { ETypeStage } from 'src/utils/enums/enums';
import { UserService } from '../user/user.service';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');



@Injectable()
export class PostService {

  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    private userService: UserService,
  ) {
    dayjs.extend(utc);
    dayjs.extend(timezone);
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


      let results = await this.postRepository.save({...createPostDto, user});
 
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

  async recordsTotal(){
    let response: IResponse;
    try {
      const recordsTotal = await this.postRepository
        .createQueryBuilder('post')
        .where('post.parent_id IS NULL')
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

  async findAll(type = '', start = 1, limit = 50, typeOrder = 'recentes') {
    let response: IResponse;
    try {
      let results = await this.getPostsWithChildren(type, start, limit, typeOrder);
      results = this.sortById(results)
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

  sortById(posts: CreatePostDto[]){
    return posts.sort((a, b) => a.id - b.id);
  }

  async getPostsWithChildren(type = '', start = 1, limit = 50, typeOrder = 'recentes') {
    start = Math.max(1, start); 
    let where;
    let sort;
    let order;
    if (type in ETypeStage) {
      where = `post.parent_id IS NULL and post.type_stage = '${type}'`;
    } else {
      where = 'post.parent_id IS NULL' 
    }

    if(order === 'relevantes'){
      sort = 'JSON_LENGTH(post.likes)';
      order = 'DESC'
    }else{
      sort = 'post.id';
      order = 'DESC'
    }

    try {

      // Primeiro, busca os posts pais
      let parents = await this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'users')  // Join com a tabela users utilizando owner_id
      .where(where)
      .orderBy(sort, order)  // Ordena pelos itens mais recentes
      .limit(limit)          // Limita ao número de itens por página
      .offset((start - 1) * limit) 
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
        toArray()
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
