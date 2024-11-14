/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { IResponse } from 'src/utils/interfaces/response';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private paymentServie: PaymentService
  ) {}

  async isNew(email: string) {
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
      delete createUserDto.permission;
      await this.userRepository.save(createUserDto);
      const results = await this.userRepository.findOneBy({
        email: createUserDto.email,
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
      return response;
    }
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOneById(id: number) {
    return await this.userRepository.findOneBy({ id });
  }

  async findOne(email: string) {
    let response: IResponse;
    try {
      const user = await this.userRepository.findOneBy({ email });
      const plan = await this.paymentServie.getCurrentPaymentForUser(user.id);
      response = {
        error: false,
        results: {...user, plan: JSON.stringify(plan)},
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

  async update(id: number, updateUserDto: UpdateUserDto) {
    let response: IResponse;
    try {
      delete updateUserDto.permission;
      await this.userRepository.update(id, updateUserDto);
      const results = await this.userRepository.findOneBy({ id });
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

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
