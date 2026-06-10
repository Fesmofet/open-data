---
id: docs-skills-hive-account-signup
title: Hive account signup
type: skill
status: active
scope: platform
tags: [hive, account, signup, blockchain, keys, onboarding]
updated_at: 2026-06-10
related:
  - docs/README.md
  - docs/skills/setup-workspace.md
  - docs/skills/hive-blockchain-broadcast.md
  - docs/standards/docs-standards.md
  - docs/apps/auth-api/spec/challenge-flow.md
---

# Hive account signup

Guide a user through creating a new Hive blockchain account using the best **public provider** for their constraints.

## When to use

- User needs a **new Hive account** (username + keys) for Waivio/ODL apps, Hive signing, or testing.
- User asks which signup option is free, instant, anonymous, or cheapest.
- Onboarding before [auth-api challenge flow](../apps/auth-api/spec/challenge-flow.md) (user must already have keys).

## When not to use

- User already has an account — help with **wallet import** or login, not signup.
- User wants **password reset** or **username rename** — Hive does not support these; explain key custody instead.
- Task is only about **this repo's local dev** — see [getting-started.md](../getting-started.md).

## Source of truth (required each run)

**Do not rely on this file alone for provider list or pricing.**

1. Open and read: **https://signup.hive.io/**
2. Parse the **Registration Providers** section (names, price, instant vs delayed, verification, payment methods).
3. Rank options against the user's criteria (free, instant, anonymous, already has HIVE, etc.).
4. If a chosen provider fails or is unavailable, return to signup.hive.io and pick the next best match.

Optional secondary references (provider UX details, not a substitute for signup.hive.io):

- Ecency signup docs: https://docs.ecency.com/signup.html

## Typical providers (verify on page)

Last aligned with signup.hive.io content; **re-fetch before recommending**.

| Provider | Price | Speed | Verification | Notes |
|----------|-------|-------|--------------|-------|
| **InLeo** | Free | Instant | Email / Google / X | Good default for free + instant if user accepts verification |
| **Ecency** | Free (in-app paid ~$2.99 optional) | Instant | Email or crypto wallet | Free tier may have extra checks; paid in-app bypass |
| **Hivedex.io** | ~$1.49 | Instant | Anonymous | Crypto payments (many chains listed on page) |
| **HiveDapps** | Free | **Delayed** | Requires existing community member | No rush, no payment |
| **Actifit** | ~$2 | Instant | No verification | Pay with **HIVE**; user must already hold HIVE |

Hive accounts are **created by another account** and have a cost; providers subsidize or charge differently.

## Decision rules

Apply **after** parsing signup.hive.io for the current run:

1. **Free + accepts verification** → prefer **InLeo** or **Ecency** (email/wallet path per user preference).
2. **Free + no rush** → **HiveDapps** (delayed; needs community member).
3. **Anonymous / no verification / pay with crypto** → **Hivedex.io**.
4. **Already has HIVE + instant + no verification** → **Actifit**.
5. **Provider fails or blocks signup** → re-read signup.hive.io; try next-ranked option; do not invent alternate APIs.
6. **Never invent reset/recovery** → Hive has **no password reset**. Lost keys = lost account unless user saved backups.

### Default fallbacks (if user gives no preference)

| Priority | Provider | Rationale |
|----------|----------|-----------|
| Free general | Ecency or InLeo | Instant, common path |
| Anonymous cheap | Hivedex.io | Paid, minimal KYC |
| Has HIVE | Actifit | HIVE-denominated, instant |

## Agent workflow

### 1. Clarify constraints

Ask (or infer from context):

- Free vs paid OK?
- Instant vs can wait (days)?
- OK with email/social verification?
- Need anonymous signup?
- Already holds HIVE?

### 2. Fetch and rank

```text
GET https://signup.hive.io/  → extract provider cards (name, price, bullets)
```

Build a short ranked list with one-line reason each.

### 3. Confirm username

- Hive usernames: **3–16 characters**, lowercase, rules per provider UI.
- **Confirm spelling with user before final submit** — names cannot be renamed later.

### 4. Guide through official provider UI only

- Open the provider link from signup.hive.io (or provider's official signup URL linked from there).
- User completes signup in browser/wallet; agent does **not** impersonate the user on third-party sites unless explicitly asked to automate browser steps.

### 5. Key export and storage

After creation, ensure user:

- Downloads or records **owner**, **active**, **posting**, and **memo** keys (or seed) from the provider/wallet flow.
- Understands there is **no** “forgot password”.
- Does **not** store keys in chat logs, email, Google Docs, or agent memory.

Point to signup.hive.io **What's next?** (wallet choice) when appropriate.

### 6. Key custody for later broadcasts

Before any on-chain write, the user must choose how **signing** works for follow-up tasks (see [Hive blockchain broadcast](hive-blockchain-broadcast.md)):

| User choice | Meaning |
|-------------|---------|
| **Wallet signs** | Keys stay in Keychain / HiveAuth / HiveSigner; agent only builds transaction payloads |
| **Payload only** | Agent prints ops/envelope; user signs with their own tool |
| **Session posting key** | User pastes posting key for one automation session (discouraged unless explicitly requested) |

Ask this **after** keys are exported, not during signup UI. Do not assume the user wants the agent to store keys.

## Key handling rules (mandatory)

- **Never** store Hive owner/active/posting/memo keys in repo, `.env`, tickets, or agent long-term memory **unless** the user explicitly chose [session posting key mode](hive-blockchain-broadcast.md#key-custody-decide-with-the-user-first) for a bounded task — then clear after use.
- **Never** send keys to third parties except what the **selected official signup flow** requires in-browser.
- Prefer flows where the user **downloads keys locally** (file or wallet export).
- **Warn:** accounts cannot be renamed; keys cannot be reset by Hive.
- **Confirm username** before irreversible creation step.

## Verification

Signup succeeded when the user can:

- Log in with a supported wallet (Hive Keychain, Ecency, etc.) using the new username, **or**
- Look up the account on a block explorer / `condenser_api.get_accounts` and see the new name.

Agent verification (no keys required):

```bash
# Example: account exists (public RPC; replace USERNAME)
curl -s -X POST https://api.hive.blog -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","method":"condenser_api.get_accounts","params":[["USERNAME"]],"id":1}'
```

Non-empty `result[0].name` matching the chosen username → account created.

## Related

- [Hive blockchain broadcast](hive-blockchain-broadcast.md) — next step: ODL txs after account exists
- [signup.hive.io](https://signup.hive.io/) — live provider list (canonical)
- [Setup agent workspace](setup-workspace.md) — clone repo / GitHub raw for code work
- [auth-api challenge flow](../apps/auth-api/spec/challenge-flow.md) — login after account exists
- [Documentation standards](../standards/docs-standards.md) — skill file conventions
