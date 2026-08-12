export type HasAuthDeepLinkInput = {
  account: string;
  uuid: string;
  key: string;
  host: string;
};

export function buildHasAuthDeepLink(input: HasAuthDeepLinkInput): string {
  const payload = {
    account: input.account,
    uuid: input.uuid,
    key: input.key,
    host: input.host,
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `has://auth_req/${base64}`;
}
