/* eslint-disable */
module.exports = async function () {
  const host = process.env.HOST ?? '127.0.0.1';
  const port = process.env.PORT ?? '7500';
  process.env.HOST = host;
  process.env.PORT = port;
  process.env.AGENT_WALLET_BEARER_TOKEN =
    process.env.AGENT_WALLET_BEARER_TOKEN ??
    'e2e-test-bearer-token-32chars-min';
  process.env.E2E_BASE_URL = `http://${host}:${port}`;
};
