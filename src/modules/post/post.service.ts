import { Injectable } from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { Repository } from 'typeorm';
import { IResponse } from 'src/utils/interfaces/response';
import { CreatePostDto } from './dto/create-post.dto';
import { firstValueFrom, from, lastValueFrom, map, mergeMap, Observable, of, switchMap, toArray } from 'rxjs';

@Injectable()
export class PostService {

  constructor(
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
  ) {}
  
  async create(createPostDto: CreatePostDto) {
    let response: IResponse;
    try {
      delete createPostDto.id;
      const newPost = await this.postRepository.save(createPostDto);

      const {results} = await this.findOne(newPost.id);

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

  async findAll() {
    let response: IResponse;
    try {
      let results = await this.getPostsWithChildren();
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

  async getPostsWithChildren() {
    // Primeiro, busca os posts pais
    let parents = await this.postRepository.createQueryBuilder('post')
    .where('post.parent_id IS NULL')
    .getMany() as CreatePostDto[];
    

    console.log('paisss', parents);
    
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
      mergeMap(post => {
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

  async findOne(id: number) {

    let response: IResponse;
    let results;
    try {
      let parent = await this.postRepository.findOneBy({id}) as CreatePostDto;
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

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
