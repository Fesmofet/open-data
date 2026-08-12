import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { chmod } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AGENT_WALLET_SESSION_FILE,
  AGENT_WALLET_TOKEN_FILE,
} from '../constants/local-files';
import type { AgentWalletConfig } from '../config/agent-wallet.config';

const chmodAsync = promisify(chmod);

@Injectable()
export class LocalFilesService {
  private readonly logger = new Logger(LocalFilesService.name);

  constructor(private readonly config: ConfigService<AgentWalletConfig, true>) {}

  getDataDir(): string {
    return this.config.get('dataDir', { infer: true });
  }

  tokenPath(): string {
    return join(this.getDataDir(), AGENT_WALLET_TOKEN_FILE);
  }

  sessionPath(): string {
    return join(this.getDataDir(), AGENT_WALLET_SESSION_FILE);
  }

  async ensureDataDir(): Promise<void> {
    await mkdir(this.getDataDir(), { recursive: true });
  }

  async writeSecretFile(path: string, content: string): Promise<void> {
    await this.ensureDataDir();
    await writeFile(path, content, { encoding: 'utf8', mode: 0o600 });
    try {
      await chmodAsync(path, 0o600);
    } catch (error) {
      this.logger.warn(
        `Could not chmod ${path} to 0600: ${(error as Error).message}`,
      );
    }
  }

  async readTextFile(path: string): Promise<string | null> {
    try {
      return await readFile(path, { encoding: 'utf8' });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await unlink(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async canWriteSecretFiles(): Promise<boolean> {
    try {
      await this.ensureDataDir();
      const probe = join(this.getDataDir(), `.write-probe-${process.pid}`);
      await writeFile(probe, 'ok', { encoding: 'utf8' });
      await unlink(probe);
      return true;
    } catch {
      return false;
    }
  }
}
