import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

// Marque une route comme accessible sans jeton. Le guard global
// (JwtAuthGuard) exige un jeton partout ailleurs : n'utiliser que pour la
// connexion et le renouvellement de session.
export const Public = () => SetMetadata(IS_PUBLIC, true);
