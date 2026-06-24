import { Module } from '@nestjs/common';
import { JwtAuthModule } from '@opden-data-layer/clients';
import { AuthorOwnsAccountGuard } from './author-owns-account.guard';
import { ViewerMatchesJwtGuard } from './viewer-matches-jwt.guard';

@Module({
  imports: [JwtAuthModule],
  providers: [AuthorOwnsAccountGuard, ViewerMatchesJwtGuard],
  exports: [JwtAuthModule, AuthorOwnsAccountGuard, ViewerMatchesJwtGuard],
})
export class AuthModule {}
