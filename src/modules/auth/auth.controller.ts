import { Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('firebase')
  authenticateWithFirebase(
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.authenticateWithFirebaseToken(authorization);
  }
}
