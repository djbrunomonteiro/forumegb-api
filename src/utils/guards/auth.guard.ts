import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const decoded = await this.authService.verifyAuthorizationHeader(
      request?.headers?.authorization as string | undefined,
    );

    request.firebaseUser = decoded;
    return true;
  }
}
