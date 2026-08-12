import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { waitForPortOpen } from '@nx/node/utils';

import { FakeHasServer } from './fake-has-server';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

declare global {
  // eslint-disable-next-line no-var
  var __FAKE_HAS__: FakeHasServer | undefined;
  // eslint-disable-next-line no-var
  var __FAKE_HAS_PORT__: number | undefined;
  // eslint-disable-next-line no-var
  var __AGENT_WALLET_PROC__: ChildProcess | undefined;
}

module.exports = async function () {
  console.log('\nSetting up agent-wallet e2e...\n');

  const fakeHasPort = 17_500;
  const fakeHas = new FakeHasServer();
  await fakeHas.start(fakeHasPort);
  globalThis.__FAKE_HAS__ = fakeHas;
  globalThis.__FAKE_HAS_PORT__ = fakeHasPort;

  const host = process.env.HOST ?? '127.0.0.1';
  const port = process.env.PORT ? Number(process.env.PORT) : 7500;
  const repoRoot = join(__dirname, '../../../..');
  const mainJs = join(repoRoot, 'dist/apps/agent-wallet/main.js');

  const child = spawn(process.execPath, [mainJs], {
    cwd: join(repoRoot, 'apps/agent-wallet'),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host,
      ODL_NETWORK: 'testnet',
      HAS_WS_URL: `ws://127.0.0.1:${fakeHasPort}`,
      AGENT_WALLET_BEARER_TOKEN:
        process.env.AGENT_WALLET_BEARER_TOKEN ??
        'e2e-test-bearer-token-32chars-min',
      AGENT_WALLET_NO_PERSIST: 'true',
      AGENT_WALLET_DATA_DIR: join(repoRoot, '.tmp/agent-wallet-e2e'),
    },
    stdio: 'inherit',
  });
  globalThis.__AGENT_WALLET_PROC__ = child;

  await waitForPortOpen(port, { host });

  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down agent-wallet e2e...\n';
};
