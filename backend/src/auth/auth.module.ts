// Authentification et limitation de débit. Les deux guards sont déclarés ici,
// dans cet ordre : la limitation s'applique d'abord (elle freine aussi les
// requêtes sans jeton), puis le jeton est exigé.
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { getJwtSecret, ISSUER } from './auth.config.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: getJwtSecret(),
        // Algorithme imposé à la signature comme à la vérification.
        signOptions: { algorithm: 'HS256', issuer: ISSUER },
        verifyOptions: { algorithms: ['HS256'], issuer: ISSUER },
      }),
    }),
    // THROTTLE_LIMIT : requêtes par minute et par IP, toutes routes
    // confondues (le front en enchaîne plusieurs à chaque page ouverte).
    ThrottlerModule.forRootAsync({
      imports: [],
      useFactory: () => ({
        throttlers: [{ ttl: 60_000, limit: Number(process.env.THROTTLE_LIMIT) || 300 }],
        errorMessage: 'Trop de requêtes, veuillez réessayer dans quelques instants',
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
