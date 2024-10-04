/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { IResponse } from 'src/utils/interfaces/response';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async isNew(email: string) {
     console.log(email);
    let response: IResponse;
    try {
      const results = await this.userRepository.find({ where: { email } });
      response = {
        error: false,
        results,
        message: 'operação realizada com sucesso.',
      };
      return response;
    } catch (error) {
      response = {
        error: true,
        results: error,
        message: 'falha ao realizar operação',
      };
      return response;
    }
  }

  async create(createUserDto: CreateUserDto) {
    let response: IResponse;
    try {
      delete createUserDto.id;
      await this.userRepository.save(createUserDto);
      const results = await this.userRepository.findBy({email: createUserDto.email})
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

  findAll() {
    return `This action returns all user`;
  }

  async findOne(email: string) {
    let response: IResponse;
    try {
      
      const results = await this.userRepository.findOneBy({email});
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

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
