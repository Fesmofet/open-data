import { killPort } from '@nx/node/utils';

/* eslint-disable */

module.exports = async function () {
  const port = process.env.PORT ? Number(process.env.PORT) : 7500;

  const proc = globalThis.__AGENT_WALLET_PROC__;
  if (proc && !proc.killed) {
    proc.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      proc.once('exit', () => resolve());
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
        resolve();
      }, 2_000);
    });
  }

  const fakeHasPort = globalThis.__FAKE_HAS_PORT__ ?? 17_500;
  await globalThis.__FAKE_HAS__?.stop().catch(() => undefined);
  await killPort(fakeHasPort);
  await killPort(port);

  console.log(globalThis.__TEARDOWN_MESSAGE__);
};
