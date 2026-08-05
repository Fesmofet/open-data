export type HasAuthPayloadInput = {
  account: string;
  uuid: string;
  key: string;
  host: string;
};

export function buildHasAuthDeepLink(input: HasAuthPayloadInput): string {
  const payload = {
    account: input.account,
    uuid: input.uuid,
    key: input.key,
    host: input.host,
  };
  const base64 = btoa(JSON.stringify(payload));
  return `has://auth_req/${base64}`;
}
