/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { IResponse } from 'src/utils/interfaces/response';
import { PaymentService } from '../payment/payment.service';
import { DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private paymentServie: PaymentService,
  ) {}

  async isNew(email: string) {
    let response: IResponse;
    try {
      const { results } = await this.findOne(email);
      const users = [results].filter((elem: any) => elem);
      response = {
        error: false,
        results: users,
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
      const { results } = await this.findOne(createUserDto.email);
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
      const results = await this.userRepository.find({
        order: { id: 'DESC' },
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

  async findOneById(id: number) {
    return await this.userRepository.findOneBy({ id });
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOneBy({ email });
  }

  async findOne(email: string) {
    let response: IResponse;
    try {
      const user = await this.findByEmail(email);

      if (!user) {
        response = {
          error: false,
          results: null,
          message: 'usuário não encontrado.',
        };
        return response;
      }

      const plan = await this.paymentServie.getCurrentPaymentForUser(user.id);
      response = {
        error: false,
        results: { ...user, plan: JSON.stringify(plan) },
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
      const userRef = await this.userRepository.findOneBy({ id });
      const { results } = await this.findOne(userRef.email);
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

  async findOrCreateFromFirebaseToken(decoded: DecodedIdToken) {
    const email = decoded.email;

    if (!email) {
      throw new Error('Token Firebase sem e-mail');
    }

    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      const { results } = await this.findOne(email);
      return results;
    }

    const metadata = JSON.stringify({
      firebaseUid: decoded.uid,
      provider: decoded.firebase?.sign_in_provider ?? null,
    });

    const createUserDto: CreateUserDto = {
      displayName: decoded.name ?? email,
      email,
      photoURL: decoded.picture ?? '',
      metadata,
    };

    const { results } = await this.create(createUserDto);
    return results;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
