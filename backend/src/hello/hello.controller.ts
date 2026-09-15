// ===== CONTROLLER =====
// Reçoit les requêtes HTTP envoyées par la View (frontend/src/App.tsx via
// fetch) et renvoie une réponse JSON. Il ne fait AUCUNE requête à la base
// de données lui-même : il délègue toujours au Model (HelloService).
// Déclaré comme provider "controllers" dans hello.module.ts.
import { Controller, Get } from '@nestjs/common';
import { HelloService } from './hello.service.js';

@Controller('hello') // → toutes les routes ici commencent par /hello
export class HelloController {
  // NestJS injecte automatiquement HelloService (voir hello.module.ts)
  constructor(private readonly helloService: HelloService) {}

  // GET /hello : appelée par le frontend au chargement de la page.
  @Get()
  async getHello(): Promise<{ message: string; numero: number }> {
    const data = await this.helloService.getMessage(); // → délégation au Model
    return { message: data.content, numero: data.numero }; // renvoyé en JSON au frontend
  }
}
