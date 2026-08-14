import { stat } from 'node:fs/promises';

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

  beforeEach(() => {
    jest.clearAllMocks();
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
});
