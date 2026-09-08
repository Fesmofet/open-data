import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import { chmod } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AGENT_WALLET_QR_FILE,
  AGENT_WALLET_SESSION_FILE,
  AGENT_WALLET_TOKEN_FILE,
  WAIVIO_AUTH_DIR,
  WAIVIO_AUTH_SESSION_FILE,
} from '../constants/local-files';
import type { AgentWalletConfig } from '../config/agent-wallet.config';
import { isValidHiveAccountName, normalizeHiveAccount } from '../utils/hive-account';

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

  qrPath(): string {
    return join(this.getDataDir(), AGENT_WALLET_QR_FILE);
  }

  sessionPath(): string {
    return join(this.getDataDir(), AGENT_WALLET_SESSION_FILE);
  }

  waivioAuthDir(): string {
    return join(this.getDataDir(), WAIVIO_AUTH_DIR);
  }

  legacyWaivioAuthSessionPath(): string {
    return join(this.getDataDir(), WAIVIO_AUTH_SESSION_FILE);
  }

  waivioAuthSessionPath(account: string): string {
    const normalized = normalizeHiveAccount(account);
    if (!isValidHiveAccountName(normalized)) {
      throw new Error(`Invalid Hive account name: ${account}`);
    }
    return join(this.waivioAuthDir(), `${normalized}.json`);
  }

  async listWaivioAuthAccounts(): Promise<string[]> {
    try {
      const entries = await readdir(this.waivioAuthDir(), { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => entry.name.replace(/\.json$/, ''))
        .filter((account) => isValidHiveAccountName(account));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async ensureDataDir(): Promise<void> {
    await mkdir(this.getDataDir(), { recursive: true });
  }

  async ensureWaivioAuthDir(): Promise<void> {
    await this.ensureDataDir();
    await mkdir(this.waivioAuthDir(), { recursive: true, mode: 0o700 });
    try {
      await chmodAsync(this.waivioAuthDir(), 0o700);
    } catch (error) {
      this.logger.warn(
        `Could not chmod ${this.waivioAuthDir()} to 0700: ${(error as Error).message}`,
      );
    }
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

  async writeSecretFileAtomic(path: string, content: string): Promise<void> {
    await this.ensureDataDir();
    const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`;
    try {
      await writeFile(tempPath, content, { encoding: 'utf8', mode: 0o600 });
      await chmodAsync(tempPath, 0o600);
      await rename(tempPath, path);
    } catch (error) {
      await unlink(tempPath).catch(() => undefined);
      throw error;
    }
  }

  async writeBinaryFile(path: string, content: Buffer): Promise<void> {
    await this.ensureDataDir();
    await writeFile(path, content, { mode: 0o644 });
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
