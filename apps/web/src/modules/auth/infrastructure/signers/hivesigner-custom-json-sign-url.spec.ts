import { buildHiveSignerCustomJsonSignUrl } from './hivesigner-custom-json-sign-url';

describe('buildHiveSignerCustomJsonSignUrl', () => {
  it('encodes required_auths and required_posting_auths as JSON arrays', () => {
    const url = buildHiveSignerCustomJsonSignUrl(
      {
        required_auths: ['flowmaster'],
        required_posting_auths: [],
        id: 'ssc-mainnet-hive',
        json: JSON.stringify({
          contractName: 'tokens',
          contractAction: 'stake',
          contractPayload: { to: 'flowmaster', symbol: 'WAIV', quantity: '0.01' },
        }),
      },
      'http://localhost:3000/@flowmaster/transfers?type=WAIV',
    );

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      'https://hivesigner.com/sign/custom_json',
    );
    expect(parsed.searchParams.get('authority')).toBe('active');
    expect(parsed.searchParams.get('required_auths')).toBe('["flowmaster"]');
    expect(parsed.searchParams.get('required_posting_auths')).toBe('[]');
    expect(parsed.searchParams.get('id')).toBe('ssc-mainnet-hive');
    expect(parsed.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/@flowmaster/transfers?type=WAIV',
    );
  });
});
