declare module 'hive-auth-wrapper' {
  export type HasAuthObject = {
    username: string;
    expire?: number;
    key?: string;
    token?: string;
  };

  export type HasAppMeta = {
    name: string;
    description?: string;
    icon?: string;
  };

  export type HasChallengeData = {
    key_type: string;
    challenge: string;
  };

  const HAS: {
    setOptions(options: { host?: string; auth_key_secret?: string }): void;
    status(): { host: string; connected: boolean; timeout: number };
    connect(): Promise<boolean>;
    authenticate(
      auth: HasAuthObject,
      appMeta: HasAppMeta,
      challengeData?: HasChallengeData,
      cbWait?: (event: {
        uuid: string;
        expire: number;
        account: string;
        key: string;
      }) => void,
    ): Promise<unknown>;
    broadcast(
      auth: HasAuthObject & { key: string },
      keyType: string,
      ops: unknown[],
      cbWait?: (event: unknown) => void,
    ): Promise<unknown>;
    challenge(
      auth: HasAuthObject & { key: string },
      challengeData: HasChallengeData,
      cbWait?: (event: unknown) => void,
    ): Promise<unknown>;
  };

  export default HAS;
}
