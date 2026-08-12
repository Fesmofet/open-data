export const AGENT_WALLET_MCP_INSTRUCTIONS = `Local HAS agent wallet daemon for ODL.

Workflow:
1. Read bearer token from ~/.odl/agent-wallet.token (or daemon startup log).
2. Call has_login_start({ account }) — show deepLink / qrAscii to the user.
3. Poll has_login_status({ requestId }) until status is active, rejected, or expired.
4. Build ops with odl_build_object_create({...}) or supply your own ops.
5. Call has_broadcast({ ops, keyType: "posting" }) then poll has_broadcast_status({ requestId }).

Security: daemon binds 127.0.0.1 only; every MCP request requires Authorization: Bearer <token>.
Session secrets never appear in tool responses.`;
