import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { HivesignerCallbackService } from './callback/hivesigner-callback.service';
import { CreateChallengeService } from './challenge/create-challenge.service';
import { HiveNodeService } from './providers/hive-node.service';
import { HivesignerApiService } from './providers/hivesigner-api.service';
import { IssueSessionService } from './session/issue-session.service';
import { PostingSignatureVerifierService } from './verify/posting-signature-verifier.service';
import { LogoutService } from './session/logout.service';
import { RefreshSessionService } from './session/refresh-session.service';
import { TokenModule } from './token/token.module';
import { VerifyHiveAuthService } from './verify/verify-hiveauth.service';
import { VerifyKeychainService } from './verify/verify-keychain.service';

@Module({
  imports: [TokenModule, RepositoriesModule],
  providers: [
    HiveNodeService,
    HivesignerApiService,
    PostingSignatureVerifierService,
    CreateChallengeService,
    VerifyKeychainService,
    VerifyHiveAuthService,
    HivesignerCallbackService,
    IssueSessionService,
    RefreshSessionService,
    LogoutService,
  ],
  exports: [
    CreateChallengeService,
    VerifyKeychainService,
    VerifyHiveAuthService,
    HivesignerCallbackService,
    IssueSessionService,
    RefreshSessionService,
    LogoutService,
  ],
})
export class AuthDomainModule {}
