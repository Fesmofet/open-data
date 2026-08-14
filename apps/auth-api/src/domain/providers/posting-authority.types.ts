export type PostingKeyAuth = readonly [publicKey: string, weight: number];

export type PostingAuthority = {
  keyAuths: PostingKeyAuth[];
  weightThreshold: number;
};
