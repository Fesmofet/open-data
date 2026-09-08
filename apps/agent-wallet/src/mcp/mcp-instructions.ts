export const AGENT_WALLET_MCP_INSTRUCTIONS = `Local agent wallet daemon for ODL: local Hive keys (primary), optional HAS session, Waivio JWT auth, and IPFS image upload.

Default Waivio API origin: https://waiviodev.com (override with WAIVIO_API_ORIGIN).

Workflow (local keys — primary):
1. Set AGENT_WALLET_SIGNING_MODE=local, HIVE_ACCOUNT, HIVE_POSTING_KEY; optional HIVE_ACTIVE_KEY for active ops.
2. waivio_auth_start signs the auth challenge locally (no HAS login required).
3. ipfs_upload_image({ filePath }) for avatars — prepare 1:1 up to 1024px, upload, write only { "cid": "..." } on chain. Do not store generated CDN URLs (e.g. files-cdn.x.ai); download, crop, upload to IPFS. Verify contentUrl loads before broadcast.
4. Build ops (see decision table below) → wallet_broadcast → poll wallet_broadcast_status immediately.
5. After broadcast, verify fields on the object via query-api (resolve_object).

Posting authority (act-as grantor):
- Names in ops = grantor (e.g. flowmaster author); signature = wallet identity posting key (e.g. waivio.import).
- Pre-flight: get_user_authority_grantors({ account: <wallet identity>, type: "posting" }) — grantor must appear.
- Grant/revoke posting: hive_build_posting_authority_grant → keyType active, signerAccount = grantor. Local: broadcast via wallet_broadcast when canSignLocally is true; else payload. HAS: if wallet identity is the grantor, has_broadcast with keyType active (phone approval); otherwise payload for grantor. Confirm with user before any grant/revoke or value-moving active op.

ODL build decision table:
- NEW object → odl_build_object_create (always includes object_create; check suggestIpfsBatch / perOpBytes when warnings)
- EXISTING object, one field (avatar image, title, description, …) → odl_build_update_create
- EXISTING object, gallery photo → odl_build_gallery_item (pass existingGalleryAlbumNames from resolve_object fields.imageGallery)
- Hive root post (article, companion post, recipe walkthrough) → hive_build_post (author may be a grantor — see posting authority above) → wallet_broadcast
- Grant/revoke posting authority → hive_build_posting_authority_grant → wallet_broadcast when canSignLocally; HAS grantor session → has_broadcast with keyType active
- Avatar on existing object: ipfs_upload_image → odl_build_update_create({ updateType: "image", value: { cid } }) → wallet_broadcast
- After any update_create from the tools above: do NOT add update_vote — chain-indexer auto-approves creator validity

Broadcast pitfalls:
- One object per tx; prefer IPFS batch when odl_build_object_create returns suggestIpfsBatch or opsCount >= 4.
- wallet_broadcast signs as the configured wallet identity only — no account argument; put delegated account names inside ops.
- Fat custom_json (near 8 KB per op) may cause timeout even when under Hive limit.

Workflow (HAS signing — optional):
1. Read MCP bearer token from ~/.odl/agent-wallet.token.
2. has_login_start → send webLink to user → poll has_login_status until active.
3. waivio_auth_start → poll waivio_auth_status until active (uses HAS session to sign auth challenge).
4. Build ops → has_broadcast → poll has_broadcast_status immediately after phone approve (posting key auto-approve does not send a "done" UI event).
5. On has_broadcast_status expired: resolve_object first — do not resend same ops (Keychain may have already broadcast).
6. Two consecutive expired with no chain change → has_login_start (relogin); stop bulk catalog loops.

Credential separation:
- ~/.odl/agent-wallet.token — MCP bearer only
- ~/.odl/agent-wallet-session.json — HAS session only
- ~/.odl/waivio-auth-session.json — Waivio refresh token only (access JWT stays in memory)
- Hive WIF keys — env only (HIVE_POSTING_KEY / HIVE_ACTIVE_KEY), never persisted

Security: binds 127.0.0.1 only; MCP requires Authorization: Bearer. Tool responses never include JWT, HAS secrets, or WIF keys.`;
