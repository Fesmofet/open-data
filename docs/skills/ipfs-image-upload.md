# IPFS image upload for ODL agents

Use this skill when an agent must attach images to ODL object updates via `agent-wallet`.

## Prerequisites

1. Active Waivio JWT session (`waivio_auth_start` → `waivio_auth_status`).
2. `agent-wallet` MCP bearer token.
3. Default API origin: `https://waiviodev.com` (`WAIVIO_API_ORIGIN` override for other stacks).

## Upload tool

```
ipfs_upload_image({ filePath: "/absolute/or/relative/path/to/image.png" })
```

Returns `{ cid, url? }` only. **Never** write `url` into ODL updates when `cid` is present.

## Update policy

### Object avatar (`updateType: "image"`)

**Mandatory IPFS path:**

1. `ipfs_upload_image` the local file.
2. Write update value as `{ "cid": "<returned-cid>" }` only.
3. Use returned `url` for preview in chat if needed — not in the blockchain update.

### Gallery item (`updateType: "imageGalleryItem"`)

Either:

- `{ "album": "<albumId>", "cid": "<cid>" }` after IPFS upload, or
- `{ "album": "<albumId>", "url": "https://..." }` for external HTTPS images.

Do not send both `cid` and `url` in the same gallery item.

### Gallery album (`updateType: "imageGallery"`)

Album metadata / reference only — not the image bytes. See object-create specs.

## Local signing alternative (no HAS)

Set process env (never commit keys):

```powershell
$env:AGENT_WALLET_SIGNING_MODE = "local"
$env:HIVE_ACCOUNT = "alice"
$env:HIVE_POSTING_KEY = "5K..."
# optional — active ops only:
$env:HIVE_ACTIVE_KEY = "5K..."
```

Or use a gitignored `.env` loaded by your launcher.

`HIVE_ACTIVE_KEY` is **not** required for Waivio JWT auth or typical ODL `custom_json` posting ops.

## Related skills

- [hive-has-agent-wallet.md](./hive-has-agent-wallet.md) — HAS login and broadcast
- [hive-blockchain-broadcast.md](./hive-blockchain-broadcast.md) — ODL op construction
