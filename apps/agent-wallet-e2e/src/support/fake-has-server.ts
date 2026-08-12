import { WebSocketServer, type WebSocket } from 'ws';
import CryptoJS from 'crypto-js';

const HAS_CMD = {
  CONNECTED: 'connected',
  AUTH_REQ: 'auth_req',
  AUTH_WAIT: 'auth_wait',
  AUTH_ACK: 'auth_ack',
  SIGN_REQ: 'sign_req',
  SIGN_WAIT: 'sign_wait',
  SIGN_ACK: 'sign_ack',
  SIGN_NACK: 'sign_nack',
  ATTACH_REQ: 'attach_req',
  ATTACH_ACK: 'attach_ack',
} as const;

function encryptHasPayload(payload: unknown, key: string): string {
  return CryptoJS.AES.encrypt(JSON.stringify(payload), key).toString();
}

type PendingAuth = {
  uuid: string;
  account: string;
  authKey: string;
  socket: WebSocket;
};

type PendingSign = {
  uuid: string;
  sessionKey: string;
  socket: WebSocket;
  autoApprove: boolean;
  autoReject: boolean;
};

export class FakeHasServer {
  private server: WebSocketServer | null = null;
  private readonly pendingAuth = new Map<string, PendingAuth>();
  private readonly pendingSign = new Map<string, PendingSign>();
  private nextSignBehavior: 'approve' | 'reject' = 'approve';

  async start(port: number): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server = new WebSocketServer({ host: '127.0.0.1', port }, () => resolve());
      this.server.on('error', reject);
      this.server.on('connection', (socket) => this.onConnection(socket));
    });
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close(() => resolve());
    });
    this.server = null;
    this.pendingAuth.clear();
    this.pendingSign.clear();
  }

  setNextSignBehavior(behavior: 'approve' | 'reject'): void {
    this.nextSignBehavior = behavior;
  }

  async approveAuth(input: {
    uuid: string;
    authKey: string;
    account: string;
    expireMs?: number;
  }): Promise<void> {
    const pending = this.pendingAuth.get(input.uuid);
    if (!pending) {
      throw new Error(`No pending auth for uuid ${input.uuid}`);
    }

    pending.socket.send(
      JSON.stringify({
        cmd: HAS_CMD.AUTH_ACK,
        uuid: input.uuid,
        data: encryptHasPayload(
          {
            token: 'fake-has-token',
            expire: Date.now() + (input.expireMs ?? 3_600_000),
          },
          input.authKey,
        ),
      }),
    );
  }

  private onConnection(socket: WebSocket): void {
    socket.send(
      JSON.stringify({
        cmd: HAS_CMD.CONNECTED,
        protocol: 1,
        timeout: 60,
      }),
    );

    socket.on('message', (raw) => {
      let frame: {
        cmd?: string;
        account?: string;
        uuid?: string;
      };
      try {
        frame = JSON.parse(raw.toString()) as typeof frame;
      } catch {
        return;
      }

      if (frame.cmd === HAS_CMD.AUTH_REQ && frame.account) {
        const uuid = crypto.randomUUID();
        const expire = Date.now() + 60_000;
        this.pendingAuth.set(uuid, {
          uuid,
          account: frame.account,
          authKey: '',
          socket,
        });

        socket.send(
          JSON.stringify({
            cmd: HAS_CMD.AUTH_WAIT,
            uuid,
            expire,
            account: frame.account,
          }),
        );
        return;
      }

      if (frame.cmd === HAS_CMD.SIGN_REQ) {
        const uuid = crypto.randomUUID();
        const expire = Date.now() + 60_000;
        const behavior = this.nextSignBehavior;
        this.nextSignBehavior = 'approve';

        this.pendingSign.set(uuid, {
          uuid,
          sessionKey: '',
          socket,
          autoApprove: behavior === 'approve',
          autoReject: behavior === 'reject',
        });

        socket.send(
          JSON.stringify({
            cmd: HAS_CMD.SIGN_WAIT,
            uuid,
            expire,
          }),
        );

        if (behavior === 'approve') {
          setImmediate(() => {
            socket.send(
              JSON.stringify({
                cmd: HAS_CMD.SIGN_ACK,
                uuid,
                data: 'trx-fake-1',
              }),
            );
          });
        }

        if (behavior === 'reject') {
          setImmediate(() => {
            socket.send(
              JSON.stringify({
                cmd: HAS_CMD.SIGN_NACK,
                uuid,
              }),
            );
          });
        }
        return;
      }

      if (frame.cmd === HAS_CMD.ATTACH_REQ && frame.uuid) {
        socket.send(
          JSON.stringify({
            cmd: HAS_CMD.ATTACH_ACK,
            uuid: frame.uuid,
          }),
        );
      }
    });
  }
}

export function parseHasDeepLink(deepLink: string): {
  account: string;
  uuid: string;
  key: string;
  host: string;
} {
  const base64 = deepLink.replace('has://auth_req/', '');
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8')) as {
    account: string;
    uuid: string;
    key: string;
    host: string;
  };
}
