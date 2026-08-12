import { Injectable } from '@nestjs/common';

export type LoginRequestState =
  | { status: 'pending'; account: string; deepLink: string; qrAscii: string; expiresAt: number }
  | { status: 'active'; account: string; expiresAt: number }
  | { status: 'rejected' }
  | { status: 'expired' };

export type BroadcastRequestState =
  | { status: 'pending'; expiresAt: number }
  | { status: 'signed'; transactionId: string }
  | { status: 'rejected' }
  | { status: 'error'; message: string }
  | { status: 'expired' };

@Injectable()
export class PendingRequestsStore {
  private readonly loginRequests = new Map<string, LoginRequestState>();
  private readonly broadcastRequests = new Map<string, BroadcastRequestState>();

  setLogin(requestId: string, state: LoginRequestState): void {
    this.loginRequests.set(requestId, state);
  }

  getLogin(requestId: string): LoginRequestState | undefined {
    return this.loginRequests.get(requestId);
  }

  updateLogin(requestId: string, state: LoginRequestState): void {
    this.loginRequests.set(requestId, state);
  }

  setBroadcast(requestId: string, state: BroadcastRequestState): void {
    this.broadcastRequests.set(requestId, state);
  }

  getBroadcast(requestId: string): BroadcastRequestState | undefined {
    return this.broadcastRequests.get(requestId);
  }

  updateBroadcast(requestId: string, state: BroadcastRequestState): void {
    this.broadcastRequests.set(requestId, state);
  }
}
