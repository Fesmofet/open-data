import { Injectable } from '@nestjs/common';

export type LoginRequestState =
  | {
      status: 'pending';
      account: string;
      deepLink: string;
      qrAscii: string;
      webLink?: string;
      qrPngPath?: string;
      expiresAt: number;
    }
  | { status: 'active'; account: string; expiresAt: number }
  | { status: 'rejected' }
  | { status: 'expired' };

export type PendingLoginRequestState = Extract<
  LoginRequestState,
  { status: 'pending' }
>;

export type BroadcastRequestState =
  | { status: 'pending'; expiresAt: number }
  | { status: 'signed'; transactionId: string }
  | { status: 'rejected' }
  | { status: 'error'; message: string }
  | { status: 'expired' };

export type WaivioAuthRequestState =
  | {
      status: 'pending';
      account: string;
      provider: 'keychain' | 'hiveauth';
      expiresAt: number;
    }
  | {
      status: 'active';
      account: string;
      provider: 'keychain' | 'hiveauth';
      expiresAt: number;
    }
  | { status: 'error' }
  | { status: 'expired' };

export type PendingWaivioAuthRequestState = WaivioAuthRequestState;

@Injectable()
export class PendingRequestsStore {
  private readonly loginRequests = new Map<string, LoginRequestState>();
  private readonly broadcastRequests = new Map<string, BroadcastRequestState>();
  private readonly waivioAuthRequests = new Map<string, WaivioAuthRequestState>();

  setLogin(requestId: string, state: LoginRequestState): void {
    this.loginRequests.set(requestId, state);
  }

  getLogin(requestId: string): LoginRequestState | undefined {
    return this.loginRequests.get(requestId);
  }

  updateLogin(requestId: string, state: LoginRequestState): void {
    this.loginRequests.set(requestId, state);
  }

  findPendingLogin(
    account: string,
  ): { requestId: string; state: PendingLoginRequestState } | null {
    for (const [requestId, state] of this.loginRequests) {
      if (state.status === 'pending' && state.account === account) {
        return { requestId, state };
      }
    }
    return null;
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

  setWaivioAuth(requestId: string, state: WaivioAuthRequestState): void {
    this.waivioAuthRequests.set(requestId, state);
  }

  getWaivioAuth(requestId: string): WaivioAuthRequestState | undefined {
    return this.waivioAuthRequests.get(requestId);
  }

  updateWaivioAuth(requestId: string, state: WaivioAuthRequestState): void {
    this.waivioAuthRequests.set(requestId, state);
  }
}
