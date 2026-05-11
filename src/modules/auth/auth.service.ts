import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DecodedIdToken } from 'firebase-admin/auth';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  private readonly app: App;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.app = this.getOrInitializeFirebaseApp();
  }

  private getOrInitializeFirebaseApp(): App {
    const existingApp = getApps()[0];
    if (existingApp) {
      return existingApp;
    }

    const projectId =
      this.configService.get<string>('FIREBASE_PROJECT_ID') || 'forumegb-web';
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Firebase Admin não configurado. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY com os dados da service account do Firebase.',
      );
    }

    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  async verifyAuthorizationHeader(
    authorization?: string,
  ): Promise<DecodedIdToken> {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new UnauthorizedException('Token ausente');
    }

    try {
      return await getAuth(this.app).verifyIdToken(token);
    } catch {
      throw new UnauthorizedException('Token Firebase inválido');
    }
  }

  async authenticateWithFirebaseToken(authorization?: string) {
    const decoded = await this.verifyAuthorizationHeader(authorization);
    const user = await this.userService.findOrCreateFromFirebaseToken(decoded);

    return {
      error: false,
      results: {
        token: {
          uid: decoded.uid,
          email: decoded.email ?? null,
          name: decoded.name ?? null,
          picture: decoded.picture ?? null,
          claims: decoded,
        },
        user,
      },
      message: 'autenticação realizada com sucesso.',
    };
  }
}
