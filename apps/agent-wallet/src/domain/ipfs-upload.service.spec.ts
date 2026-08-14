import { readFile, stat } from 'node:fs/promises';

import type { ConfigService } from '@nestjs/config';

import { IPFS_UPLOAD_MAX_BYTES } from '../constants/ipfs-upload';
import { IpfsUploadService } from './ipfs-upload.service';
import type { WaivioAuthSessionService } from './waivio-auth-session.service';

jest.mock('node:fs/promises', () => ({
  stat: jest.fn(),
  readFile: jest.fn(),
}));

describe('IpfsUploadService', () => {
  const config = {
    get: jest.fn().mockReturnValue('https://waiviodev.com'),
  } as unknown as ConfigService;
  const waivioAuth = {
    getAccessToken: jest.fn().mockResolvedValue('access-token'),
  } as unknown as WaivioAuthSessionService;

  const service = new IpfsUploadService(config, waivioAuth);
  const mockedStat = stat as jest.MockedFunction<typeof stat>;
  const mockedReadFile = readFile as jest.MockedFunction<typeof readFile>;

  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('rejects missing file path', async () => {
    await expect(service.uploadImage('   ')).rejects.toThrow('filePath is required');
  });

  it('rejects files above 50 MiB at validation boundary', async () => {
    mockedStat.mockResolvedValue({
      isFile: () => true,
      size: IPFS_UPLOAD_MAX_BYTES + 1,
    } as never);

    await expect(service.uploadImage('big.png')).rejects.toThrow('50 MiB');
  });

  it('uploads with image/jpeg MIME and returns contentUrl', async () => {
    mockedStat.mockResolvedValue({
      isFile: () => true,
      size: 1024,
    } as never);
    mockedReadFile.mockResolvedValue(Buffer.from('jpeg-bytes'));

    let uploadedMime = '';
    (global.fetch as jest.Mock).mockImplementation(
      async (_url: string, init: RequestInit) => {
        const form = init.body as FormData;
        const file = form.get('file');
        if (file instanceof Blob) {
          uploadedMime = file.type;
        }
        return new Response(JSON.stringify({ cid: 'QmTestCid' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    );

    const result = await service.uploadImage('/tmp/photo.jpg');

    expect(uploadedMime).toBe('image/jpeg');
    expect(result).toEqual({
      cid: 'QmTestCid',
      contentUrl:
        'https://waiviodev.com/ipfs-gateway/content/image/QmTestCid',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://waiviodev.com/ipfs-gateway/upload/image',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer access-token' },
      }),
    );
  });

  it('surfaces gateway 400 message', async () => {
    mockedStat.mockResolvedValue({
      isFile: () => true,
      size: 512,
    } as never);
    mockedReadFile.mockResolvedValue(Buffer.from('bad'));

    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Unsupported image type: application/octet-stream',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(service.uploadImage('bad.png')).rejects.toThrow(
      'Invalid image upload: Unsupported image type: application/octet-stream',
    );
  });
});
