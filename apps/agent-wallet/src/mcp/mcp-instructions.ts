export const AGENT_WALLET_MCP_INSTRUCTIONS = `Local agent wallet daemon for ODL: HAS session, optional local Hive keys, Waivio JWT auth, and IPFS image upload.

Default Waivio API origin: https://waiviodev.com (override with WAIVIO_API_ORIGIN).

Workflow (HAS signing — default):
1. Read MCP bearer token from ~/.odl/agent-wallet.token.
2. has_login_start → send webLink to user → poll has_login_status until active.
3. waivio_auth_start → poll waivio_auth_status until active (uses HAS session to sign auth challenge).
4. ipfs_upload_image({ filePath }) for avatars — write only { "cid": "..." } in ODL image updates.
5. odl_build_object_create or custom ops → wallet_broadcast / has_broadcast → poll status.

Workflow (local keys — AGENT_WALLET_SIGNING_MODE=local):
1. Set HIVE_ACCOUNT and HIVE_POSTING_KEY (optional HIVE_ACTIVE_KEY for active ops only).
2. waivio_auth_start signs the auth challenge locally (no HAS login required).
3. ipfs_upload_image and wallet_broadcast work without phone approval.

Credential separation:
- ~/.odl/agent-wallet.token — MCP bearer only
- ~/.odl/agent-wallet-session.json — HAS session only
- ~/.odl/waivio-auth-session.json — Waivio refresh token only (access JWT stays in memory)
- Hive WIF keys — env only (HIVE_POSTING_KEY / HIVE_ACTIVE_KEY), never persisted

Security: binds 127.0.0.1 only; MCP requires Authorization: Bearer. Tool responses never include JWT, HAS secrets, or WIF keys.`;
