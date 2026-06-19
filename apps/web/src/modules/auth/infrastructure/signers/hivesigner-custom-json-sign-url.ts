const HIVESIGNER_SIGN_BASE = 'https://hivesigner.com';

export type HiveSignerCustomJsonSignParams = {
  required_auths: readonly string[];
  required_posting_auths: readonly string[];
  id: string;
  json: string;
};

/**
 * HiveSigner `/sign/custom_json` expects JSON array query params for auth fields.
 * `hivesigner.sign()` only accepts scalars and stringifies arrays incorrectly.
 */
export function buildHiveSignerCustomJsonSignUrl(
  params: HiveSignerCustomJsonSignParams,
  redirectUri: string,
): string {
  const query = new URLSearchParams();
  query.set('authority', 'active');
  query.set('required_auths', JSON.stringify([...params.required_auths]));
  query.set(
    'required_posting_auths',
    JSON.stringify([...params.required_posting_auths]),
  );
  query.set('id', params.id);
  query.set('json', params.json);
  query.set('redirect_uri', redirectUri);
  return `${HIVESIGNER_SIGN_BASE}/sign/custom_json?${query.toString()}`;
}
