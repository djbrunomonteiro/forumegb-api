import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { Repository } from 'typeorm';
import { IResponse } from 'src/utils/interfaces/response';
import { CreatePostDto } from './dto/create-post.dto';
import { concatMap, firstValueFrom, from, mergeMap, Observable, toArray } from 'rxjs';

@Injectable()
export class PostService {

  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
  ) {}
  
  async create(createPostDto: CreatePostDto, fatherId?: string) {
    let response: IResponse;
    try {
      delete createPostDto.id;
      let results = await this.postRepository.save(createPostDto);

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

  async findAll(start = 1, limit = 50) {
    let response: IResponse;
    try {
      let results = await this.getPostsWithChildren(start, limit);
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
      return response;
    }

  }

  sortById(posts: CreatePostDto[]){
    return posts.sort((a, b) => a.id - b.id);
  }

  async getPostsWithChildren(start = 1, limit = 50) {
    // Primeiro, busca os posts pais
    let parents = await this.postRepository.createQueryBuilder('post')
    .where('post.parent_id IS NULL')
    .orderBy('post.id', 'DESC')  // Ordena pelos itens mais recentes
    .limit(limit)                     // Limita ao número de itens por página
    .offset((start - 1) * limit) 
    .getMany() as CreatePostDto[];
    
    const results$ = from(parents).pipe(
      mergeMap(async parent => {
      let children = await this.postRepository.find({ where: { parent_id: parent.id } }) as CreatePostDto[];

      if(!children.length){
        return parent
      }

      children = await firstValueFrom(this.getChildren(children, parent.id)) 
      return {...parent, children}
      }),
      toArray()
  )


    return firstValueFrom(results$)

  }
  

  // Função recursiva para buscar os filhos
  getChildren(posts: CreatePostDto[], parentId: number): Observable<CreatePostDto[]> {
    return from(posts).pipe(
      concatMap(post => {
        return this.postRepository.find({ where: { parent_id: post.id } }).then(async children => {
          if (!children.length) {
            return post;
          }
          // Busca recursivamente os filhos do filho
          const grandChildren = await firstValueFrom(this.getChildren(children, post.id))
          return {...post, children: grandChildren};
        });
      }),
      toArray()
    )
  }

  async findOne(param: string) {

    let response: IResponse;
    let results;
    try {

      const query = isNaN(+param) ? {slug: param} : {id: +param};
      let parent = await this.postRepository.findOneBy(query) as CreatePostDto;
      results = parent;

      let children = await this.postRepository.find({ where: { parent_id: parent.id } }) as CreatePostDto[];

      if(children.length){
        children = await firstValueFrom(this.getChildren(children, parent.id)) 
        results = {...parent, children}
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
}
