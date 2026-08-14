import {
  buildWaivioAuthBaseUrl,
  buildWaivioIpfsGatewayBaseUrl,
  imageContentUrlForCid,
} from './waivio-api-urls';

describe('waivio-api-urls', () => {
  it('defaults to waiviodev.com auth and ipfs paths', () => {
    expect(buildWaivioAuthBaseUrl('')).toBe('https://waiviodev.com/auth/v1');
    expect(buildWaivioIpfsGatewayBaseUrl('')).toBe(
      'https://waiviodev.com/ipfs-gateway',
    );
  });

  it('normalizes override origin', () => {
    expect(buildWaivioAuthBaseUrl('https://example.test/')).toBe(
      'https://example.test/auth/v1',
    );
    expect(buildWaivioIpfsGatewayBaseUrl('https://example.test/')).toBe(
      'https://example.test/ipfs-gateway',
    );
    expect(imageContentUrlForCid('https://example.test/', 'QmAbc')).toBe(
      'https://example.test/ipfs-gateway/content/image/QmAbc',
    );
  });
});
