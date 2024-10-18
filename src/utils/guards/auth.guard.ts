import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService
  ){}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const authorization = context.switchToHttp().getRequest()?.headers?.authorization as string;   
    if(!authorization){return false}   
    const token = authorization.split(' ')[1];

    try {
      // Decodifica o token sem verificar a validade
      const decoded = this.jwtService.decode(token);
      return decoded?.iss === process.env.ISS_GOOGLEPROVIDER; // Retorna as propriedades do token
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}
