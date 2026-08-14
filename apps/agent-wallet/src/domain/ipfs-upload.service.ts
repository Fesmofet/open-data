import { stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AgentWalletConfig } from '../config/agent-wallet.config';
import {
  IPFS_UPLOAD_FIELD_NAME,
  IPFS_UPLOAD_MAX_BYTES,
} from '../constants/ipfs-upload';
import { buildWaivioIpfsGatewayBaseUrl } from '../utils/waivio-api-urls';
import { WaivioAuthSessionService } from './waivio-auth-session.service';

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
]);

export type IpfsUploadResult = {
  cid: string;
  url?: string;
};

@Injectable()
export class IpfsUploadService {
  constructor(
    private readonly config: ConfigService<AgentWalletConfig, true>,
    private readonly waivioAuth: WaivioAuthSessionService,
  ) {}

  async uploadImage(filePath: string): Promise<IpfsUploadResult> {
    const resolvedPath = filePath.trim();
    if (!resolvedPath) {
      throw new Error('filePath is required');
    }

    let fileStat;
    try {
      fileStat = await stat(resolvedPath);
    } catch {
      throw new Error(`Image file not found: ${resolvedPath}`);
    }

    if (!fileStat.isFile()) {
      throw new Error(`Path is not a file: ${resolvedPath}`);
    }

    if (fileStat.size > IPFS_UPLOAD_MAX_BYTES) {
      throw new Error(
        `Image exceeds ${IPFS_UPLOAD_MAX_BYTES / (1024 * 1024)} MiB limit`,
      );
    }

    const extension = extname(resolvedPath).toLowerCase();
    if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
      throw new Error(`Unsupported image type: ${extension || '(none)'}`);
    }

    const fileBuffer = await import('node:fs/promises').then((fs) =>
      fs.readFile(resolvedPath),
    );

    return this.uploadBuffer(fileBuffer, basename(resolvedPath));
  }

  private async uploadBuffer(
    fileBuffer: Buffer,
    filename: string,
    allowRetry = true,
  ): Promise<IpfsUploadResult> {
    const accessToken = await this.waivioAuth.getAccessToken();
    const uploadUrl = `${buildWaivioIpfsGatewayBaseUrl(
      this.config.get('waivioApiOrigin', { infer: true }),
    )}/upload/image`;

    const form = new FormData();
    form.append(
      IPFS_UPLOAD_FIELD_NAME,
      new Blob([Uint8Array.from(fileBuffer)]),
      filename,
    );

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (response.status === 401 && allowRetry) {
      await this.waivioAuth.getAccessToken(true);
      return this.uploadBuffer(fileBuffer, filename, false);
    }

    if (response.status === 400) {
      throw new Error('Invalid image upload');
    }
    if (response.status === 413) {
      throw new Error('Image too large for gateway');
    }
    if (!response.ok) {
      throw new Error(`IPFS upload failed (${response.status})`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error('IPFS upload returned invalid JSON');
    }

    const cid =
      typeof body === 'object' &&
      body !== null &&
      'cid' in body &&
      typeof (body as { cid?: unknown }).cid === 'string'
        ? (body as { cid: string }).cid.trim()
        : '';

    if (!cid) {
      throw new Error('IPFS upload response missing cid');
    }

    const url =
      typeof body === 'object' &&
      body !== null &&
      'url' in body &&
      typeof (body as { url?: unknown }).url === 'string'
        ? (body as { url: string }).url
        : undefined;

    return { cid, ...(url ? { url } : {}) };
  }
}
