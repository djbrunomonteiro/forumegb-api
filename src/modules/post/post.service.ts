/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { Brackets, IsNull, Not, Repository } from 'typeorm';
import { IResponse } from 'src/utils/interfaces/response';
import { CreatePostDto } from './dto/create-post.dto';
import {
  concatMap,
  firstValueFrom,
  from,
  map,
  mergeMap,
  Observable,
  throwError,
  toArray,
} from 'rxjs';
import { EStatusPost, ETypeStage } from 'src/utils/enums/enums';
import { UserService } from '../user/user.service';
import { PreviewService } from '../preview/preview.service';
import { file } from 'googleapis/build/src/apis/file';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

@Injectable()
export class PostService {
  introducoes = [
    'Se liga nessa playlist que estamos disponibilizando, e não esquece de deixar seu comentário!',
    'Aproveite essa playlist incrível que preparamos para você e compartilhe o que achou!',
    'Curta essa playlist que criamos especialmente para você, e deixe seu comentário abaixo!',
    'Essa playlist está imperdível! Ouça agora e conte para a gente o que achou!',
    'Preparamos uma playlist especial para você! Não esqueça de comentar o que achou!',
    'Se liga nessa seleção musical que trouxemos! Adoraríamos saber sua opinião nos comentários.',
    'Essa playlist foi feita com muito carinho! Comente e diga o que achou das músicas!',
    'Ouça agora essa playlist incrível e não se esqueça de compartilhar seu feedback com a gente!',
    'Dá um play nessa playlist e depois conta nos comentários qual música você mais gostou!',
    'Essa playlist está demais! Comente o que achou e compartilhe com seus amigos!',
    'Ouça essa seleção que preparamos para você e deixe sua opinião nos comentários!',
    'Se liga nessa playlist e aproveite o melhor da música! Não esqueça de deixar um comentário!',
    'Dê um play nessa playlist incrível e conte pra gente o que achou nos comentários!',
    'Essa playlist está cheia de músicas incríveis! Queremos saber sua opinião nos comentários.',
    'Preparamos uma playlist para você curtir! Comente e diga o que achou das músicas!',
    'Dá um play nessa playlist e depois compartilhe sua opinião com a gente nos comentários!',
    'Essa seleção de músicas foi feita especialmente para você! Comente o que achou!',
    'Curta essa playlist e não esqueça de nos contar o que achou nos comentários!',
    'Aproveite essa playlist especial que criamos e não deixe de comentar!',
    'Dê um play nessa playlist incrível e compartilhe sua opinião nos comentários!',
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

  async search(stage: string, term: string) {
    let response: IResponse;
    try {
      const qb = this.postRepository.createQueryBuilder('post')
        .where('post.parent_id IS NULL')
        .andWhere('post.status = :status', { status: EStatusPost.PUBLISHED });

      if (stage && stage !== 'all' && stage !== 'undefined') {
        qb.andWhere('post.type_stage = :typeStage', { typeStage: stage });
      }

      if (term) {
        qb.andWhere(
          new Brackets((qbInner) => {
            qbInner.where('post.title LIKE :term', { term: `%${term}%` })
              .orWhere('post.body LIKE :term', { term: `%${term}%` })
              .orWhere('post.tags LIKE :term', { term: `%${term}%` })
              .orWhere('post.owner_username LIKE :term', { term: `%${term}%` });
          }),
        );
      }

      const results = await qb.orderBy('post.created_at', 'DESC').getMany();

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
      throw new BadRequestException(response);
    }
  }

  async generatePostsFolderFromDrive(folderId: string) {
    if (!folderId) {
      return 'empty';
    }
    try {
      const resListFolder = await this.previewService.listFolders(folderId);
      let folders = resListFolder?.data?.files as any[];
      if (!folders.length) {
        return 'empty';
      }

      folders.sort((a, b) => a.name - b.name);

      from(folders)
        .pipe(
          concatMap(async (folder) => {
            const resSave = await this.processPostFolder(
              folder.id,
              String(folder.name),
            );
            return {
              ...resSave,
              results: {
                id: resSave?.results?.id,
                source_url: resSave?.results?.source_url,
              },
            };
          }),
          toArray(),
        )
        .subscribe((res) => {
          console.log(res);
        });
      return 'ok';
    } catch (error) {
      return new BadRequestException(error);
    }
  }

  async generatePostsFileFromDrive(folderId: string) {
    if (!folderId) {
      return 'empty';
    }
    try {
      const list = await this.previewService.listFilesInFolder(folderId);
      const files = list?.data?.files as any[];
      if (!files.length) {
        return 'empty';
      }

      from(files)
        .pipe(
          concatMap(async (file) => {
            const resSave = await this.processPostFile(file.id, file.name);
            return {
              ...resSave,
              results: {
                id: resSave?.results?.id,
                source_url: resSave?.results?.source_url,
              },
            };
          }),
          toArray(),
        )
        .subscribe((res) => {
          console.log(res);
        });
      return 'ok';
    } catch (error) {
      return new BadRequestException(error);
    }
  }

  private async processPostFolder(folderId, folderName) {
    const res = await this.previewService.listFilesInFolder(folderId);
    const files = res?.data?.files as any[];

    const parags = files
      .map((elem) => {
        const { name } = elem;
        return `<li>${name}</li>`;
      })
      .reduce((prev, curr) => (prev += curr), '');

    const randomIndex = Math.floor(Math.random() * this.introducoes.length);

    const slug = String(folderName)
      .toLowerCase() // Converte para minúsculas
      .normalize('NFD') // Normaliza caracteres especiais
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres não alfanuméricos
      .trim() // Remove espaços no início e no fim
      .replace(/\s+/g, '-'); // Substitui espaços por '-'

    const post: CreatePostDto = {
      owner_id: 1,
      title: `${folderName}`,
      slug: `${slug}-${Date.now()}`,
      body: `<p>${this.introducoes[randomIndex]}:</p><ul> ${parags} </ul>`,
      type_stage: 'MAINSTAGE',
      source_url: `https://drive.google.com/drive/folders/${folderId}`,
    };

    return await this.create(post);
  }

  private async processPostFile(fileId, fileName) {
    const slug = String(fileName)
      .toLowerCase() // Converte para minúsculas
      .normalize('NFD') // Normaliza caracteres especiais
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres não alfanuméricos
      .trim() // Remove espaços no início e no fim
      .replace(/\s+/g, '-'); // Substitui espaços por '-'

    const post: CreatePostDto = {
      owner_id: 1,
      title: `${fileName}`,
      slug: `${slug}-${Date.now()}`,
      body: `<p>Deixe seu comentário sobre essa track!</p>`,
      type_stage: 'MAINSTAGE',
      source_url: `https://drive.google.com/file/d/${fileId}/view`,
    };

    return await this.create(post);
  }

  async like(idPost: any, idUser: any) {
    let response: IResponse;

    try {
      if (!idPost || !idUser) {
        throw new BadRequestException('idPost | idUser undefined');
      }

      const postRef = await this.postRepository.findOne({
        where: { id: +idPost },
      });

      if (!postRef) {
        throw new BadRequestException('postRef undefined');
      }

      const date = dayjs().tz('America/Sao_Paulo').format();

      let likeItem = { id_user: +idUser, date };
      let likes = [];
      likes = (JSON.parse(postRef.likes) as any[]) ?? [];

      if (postRef.likes) {
        const indexRef = likes.findIndex(
          (elem) => +elem.id_user === likeItem.id_user,
        );
        if (indexRef === -1) {
          likes.push(likeItem);
        } else {
          likes.splice(indexRef, 1);
        }
      } else {
        likes.push(likeItem);
      }

      await this.postRepository.update(postRef.id, {
        likes: JSON.stringify(likes),
      });

      const results = { ...postRef, likes };

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
      throw new BadRequestException(response);
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

      let results = await this.postRepository.save({
        ...createPostDto,
        owner_username: user.displayName,
        user,
      });

      if (fatherId) {
        const resQuery = await this.findOne(fatherId);
        if (!resQuery.error) {
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
      throw new BadRequestException(response);
    }
  }

  async recordsTotal() {
    let response: IResponse;
    try {
      const recordsTotal = await this.postRepository.count({
        where: { parent_id: IsNull() },
      });
      response = {
        error: false,
        results: { recordsTotal },
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

  async findAll(start = 0, limit = 20, typeOrder = 'recentes') {
    let response: IResponse;
    try {
      const sortOrder = typeOrder === 'antigos' ? 'ASC' : 'DESC';
      const parsedStart = Number.isNaN(+start) ? 0 : +start;
      const parsedLimit = Number.isNaN(+limit) ? 20 : +limit;

      const [results, records] = await Promise.all([
        this.postRepository
          .createQueryBuilder('post')
          .select([
            'post.id AS id',
            'post.title AS title',
            'post.music_preview AS music_preview',
            'post.thumbnail AS thumbnail',
            'post.slug AS slug',
            'post.owner_id AS owner_id',
            'post.owner_username AS owner_username',
            'post.likes AS likes',
            'post.tags AS tags',
            'post.created_at AS created_at',
          ])
          .addSelect((subQuery) => {
            return subQuery
              .select('COUNT(child.id)', 'parents')
              .from(PostEntity, 'child')
              .where('child.parent_id = post.id')
              .andWhere('child.status = :status', {
                status: EStatusPost.PUBLISHED,
              });
          }, 'parents')
          .where('post.parent_id IS NULL')
          .andWhere('post.status = :status', {
            status: EStatusPost.PUBLISHED,
          })
          .orderBy('post.created_at', sortOrder)
          .offset(parsedStart)
          .limit(parsedLimit)
          .getRawMany(),
        this.postRepository
          .createQueryBuilder('post')
          .where('post.parent_id IS NULL')
          .getCount(),
      ]);

      response = {
        error: false,
        results,
        records,
        message: 'operação realizada com sucesso.',
      };
      return response;
    } catch (error) {
      response = {
        error: true,
        results: error?.message,
        message: 'falha ao realizar operação',
      };
      throw new BadRequestException(response);
    }
  }

  async resumeOne(slug: string) {
    let response: IResponse;
    try {
      const parent = await this.postRepository.findOne({ where: { slug } });
      const child_count = await this.postRepository.countBy({
        parent_id: parent.id,
      });
      // const user = this.userService.findOne()

      const metadata = { child_count, resume: true };
      const source_url = '';
      const results = { ...parent, source_url, metadata };
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
      throw new BadRequestException(response);
    }
  }

  async resumeHome(start = 0, limit = 25) {
    let response: IResponse;
    try {
      const parents = await this.postRepository.find({
        where: { parent_id: IsNull() },
        skip: start,
        take: limit,
      });
      console.log(parents);

      const results$ = from(parents).pipe(
        mergeMap(async (parent) => {
          const child_count = await this.postRepository.countBy({
            parent_id: parent.id,
          });

          const metadata = { child_count, resume: true };
          const source_url = '';

          // const child = this.postRepository.countBy({parent_id: parent.id})
          // let children = (await this.postRepository
          //   .createQueryBuilder('post')
          //   .leftJoinAndSelect('post.user', 'users') // Faz o join com a tabela de usuários
          //   .where('post.parent_id = :parentId', { parentId: parent.id })
          //   .select([
          //     'post', // Seleciona todos os campos do post
          //     'users.photoURL', // Corrigido para usar o alias 'users'
          //     'users.social_links', // Corrigido para usar o alias 'users'
          //     'users.permission', // Corrigido para usar o alias 'users'
          //   ])
          //   .getMany()) as CreatePostDto[];

          // if (!children.length) {
          //   return parent;
          // }

          // children = await firstValueFrom(
          //   this.getChildren(children, parent.id),
          // );
          return { ...parent, source_url, metadata };
        }),
        toArray(),
        map((items) => items.sort((a, b) => b.id - a.id)),
      );

      const results = await firstValueFrom(results$);

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
      throw new BadRequestException(response);
    }
  }

  sortById(posts: CreatePostDto[]) {
    return posts.sort((a, b) => a.id - b.id);
  }

  async getPostsWithChildren(
    type = '',
    start = 0,
    limit = 20,
    typeOrder = 'recentes',
  ) {
    let where;
    let sort;
    let order;
    if (type in ETypeStage) {
      where = `post.parent_id IS NULL AND post.status = '${EStatusPost.PUBLISHED}' AND post.type_stage = '${type}'`;
    } else {
      where = `post.parent_id IS NULL AND post.status = '${EStatusPost.PUBLISHED}'`;
    }

    sort = 'post.created_at';
    order = 'DESC';

    try {
      // Primeiro, busca os posts pais
      let parents = (await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'users') // Join com a tabela users utilizando owner_id
        .where(where)
        .orderBy(sort, order) // Ordena pelos itens mais recentes
        .limit(limit) // Limita ao número de itens por página
        .offset(start)
        .select([
          'post', // Seleciona todos os campos do post
          'users.photoURL', // Corrige o alias para 'users'
          'users.social_links', // Corrige o alias para 'users'
          'users.permission', // Corrige o alias para 'users'
          'users.displayName', // Corrige o alias para 'users'
        ])
        .getMany()) as CreatePostDto[];

      const results$ = from(parents).pipe(
        mergeMap(async (parent) => {
          let children = (await this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.user', 'users') // Faz o join com a tabela de usuários
            .where('post.parent_id = :parentId', { parentId: parent.id })
            .select([
              'post', // Seleciona todos os campos do post
              'users.photoURL', // Corrigido para usar o alias 'users'
              'users.social_links', // Corrigido para usar o alias 'users'
              'users.permission', // Corrigido para usar o alias 'users'
            ])
            .getMany()) as CreatePostDto[];

          if (!children.length) {
            return parent;
          }

          children = await firstValueFrom(
            this.getChildren(children, parent.id),
          );
          return { ...parent, children };
        }),
        toArray(),
        map((items) => items.sort((a, b) => b.id - a.id)),
      );

      return firstValueFrom(results$);
    } catch (error) {
      console.log(error);

      throw new BadRequestException(error);
    }
  }

  // Função recursiva para buscar os filhos
  getChildren(
    posts: CreatePostDto[],
    parentId: number,
  ): Observable<CreatePostDto[]> {
    return from(posts).pipe(
      concatMap((post) => {
        return this.postRepository
          .createQueryBuilder('post')
          .leftJoinAndSelect('post.user', 'user') // Faz o join com a tabela de usuários
          .where('post.parent_id = :parentId', { parentId: post.id })
          .select([
            'post', // Seleciona todos os campos do post
            'user.displayName',
            'user.photoURL', // Seleciona a imagem do usuário
            'user.social_links', // Seleciona os links sociais do usuário
            'user.permission', // Seleciona a permissão do usuário
          ])
          .getMany()
          .then(async (children) => {
            if (!children.length) {
              return post;
            }
            // Busca recursivamente os filhos do filho
            const grandChildren = await firstValueFrom(
              this.getChildren(children, post.id),
            );
            return { ...post, children: grandChildren };
          });
      }),
      toArray(),
    );
  }

  async findOne(param: string): Promise<IResponse> {
    let response: IResponse;
    let results;

    try {
      const query = isNaN(+param) ? { slug: param } : { id: +param };

      // Usa o QueryBuilder para buscar o post e o usuário associado
      const parent = (await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user') // Faz o join com a tabela de usuários
        .where(query)
        .select([
          'post', // Seleciona todos os campos do post
          'user.displayName',
          'user.photoURL', // Seleciona a imagem do usuário
          'user.social_links', // Seleciona os links sociais do usuário
          'user.permission', // Seleciona a permissão do usuário
        ])
        .getOne()) as CreatePostDto;

      if (!parent) {
        throw new Error('Post não encontrado');
      }

      // Busca os filhos usando QueryBuilder
      let children = (await this.postRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.user', 'user') // Faz o join com a tabela de usuários
        .where('post.parent_id = :parentId', { parentId: parent.id })
        .select([
          'post',
          'user.displayName',
          'user.photoURL', // Seleciona a imagem do usuário
          'user.social_links', // Seleciona os links sociais do usuário
          'user.permission', // Seleciona a permissão do usuário
        ])
        .getMany()) as CreatePostDto[];

      const metadata = { child_count: children.length, resume: false };
      results = { ...parent, metadata };

      if (children.length) {
        children = await firstValueFrom(this.getChildren(children, parent.id));
        results = {
          ...results,
          children,
        };
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

      throw new BadRequestException(response);
    }
  }

  async remove(id: number) {
    let response: IResponse;
    try {
      await this.postRepository.update(id, { status: EStatusPost.DELETED });
      response = {
        error: false,
        results: { id },
        message: 'Post excluído logicamente com sucesso.',
      };
      return response;
    } catch (error) {
      response = {
        error: true,
        results: error?.message,
        message: 'Falha ao excluir post.',
      };
      throw new BadRequestException(response);
    }
  }

  async getUserPosts(userId: number) {
    let response: IResponse;
    try {
      const results = await this.postRepository.find({
        where: {
          owner_id: userId,
          parent_id: IsNull(),
          status: EStatusPost.PUBLISHED,
        },
        order: { created_at: 'DESC' },
      });
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
      throw new BadRequestException(response);
    }
  }

  async getUserComments(userId: number) {
    let response: IResponse;
    try {
      const results = await this.postRepository.find({
        where: {
          owner_id: userId,
          parent_id: Not(IsNull()),
          status: EStatusPost.PUBLISHED,
        },
        order: { created_at: 'DESC' },
      });
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
      throw new BadRequestException(response);
    }
  }

  async getUserLikedPosts(userId: number) {
    let response: IResponse;
    try {
      const results = await this.postRepository
        .createQueryBuilder('post')
        .where('post.parent_id IS NULL')
        .andWhere('post.status = :status', { status: EStatusPost.PUBLISHED })
        .andWhere('post.likes LIKE :userLike', { userLike: `%"id_user":${userId}%` })
        .orderBy('post.created_at', 'DESC')
        .getMany();
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
      throw new BadRequestException(response);
    }
  }

  async getTopRanking(limit = 5) {
    let response: IResponse;
    try {
      const posts = await this.postRepository.find({
        where: { parent_id: IsNull(), status: EStatusPost.PUBLISHED },
      });

      const ranked = await Promise.all(
        posts.map(async (post) => {
          const commentCount = await this.postRepository.countBy({
            parent_id: post.id,
            status: EStatusPost.PUBLISHED,
          });

          let likesCount = 0;
          try {
            const likesArr = JSON.parse(post.likes);
            if (Array.isArray(likesArr)) {
              likesCount = likesArr.length;
            }
          } catch {
            likesCount = 0;
          }

          const score = commentCount * 2 + likesCount;

          return {
            ...post,
            commentCount,
            likesCount,
            score,
          };
        }),
      );

      ranked.sort((a, b) => b.score - a.score);
      const results = ranked.slice(0, limit);

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
      throw new BadRequestException(response);
    }
  }

  async isAuthor(slug: string, owner_id: number) {
    const isOwner = await this.postRepository.existsBy({ slug, owner_id });
    return {
      error: false,
      results: { isOwner },
      message: isOwner
        ? 'Permitido para o author!'
        : 'Não permitido, você não é o author!',
    };
  }

  async addRoboComment() {
    const frases = [
      'Bem legal.',
      'Diferente...',
      'Nao sabia que tinha',
      'ouvindo',
      'boa :)',
      'dançante',
      'vou divulgar',
      'da de ouvir no treino',
      'hurulll',
      'v6 são d+',
      'obg por compartilhar',
    ];

    return;

    const resFindAll = await this.findAll();

    from(resFindAll.results)
      .pipe(
        mergeMap(async (post: any) => {
          const fraseAleatoria =
            frases[Math.floor(Math.random() * frases.length)];
          const body = `<p>${fraseAleatoria}</p>`;

          const createPostDto: CreatePostDto = {
            title: '',
            body,
            owner_id: 5,
            parent_id: post.id,
          };

          return await this.create(createPostDto);
        }),
      )
      .subscribe();
  }
}
