---
id: web-business-offers
title: Business — offers & requests
description: Draft editor, publish/retire, and discover catalog routes.
type: spec
status: active
scope: web
tags: [web, business, offers]
updated_at: 2026-07-16
related:
  - docs/apps/web/spec/pages/business/overview.md
---

# Business — offers & requests

**Back:** [Business overview](overview.md)

## Discover catalog

- `/business/offers` (default) and `/business/requests` — public `searchOblOffers` lists with `?author=` and `?q=`.
- `/business` redirects to `/business/offers`.
- Left nav **Discover**; Offers / Requests switcher uses URL paths (browser history).
- `/offers` and `/requests` redirect to discover.

## Draft editor (`/business/manage/offers/drafts/:draftId` or `/business/manage/requests/drafts/:draftId`)

- Eight steps (`OFFER_EDITOR_STEPS` in `offer-form.types.ts`); debounced PATCH autosave (~800ms).
- All steps have real fields: basics (incl. tags), service (`service_ref` + optional `terms.signParams`), commercial (`terms`), billing, termination (`terms.termination`), disputes, legal (`legal_ref` + off-chain `legalText`).
- **Full preview:** header button opens scrollable modal; **Open in new tab** → `.../drafts/:draftId/preview`.
- Publish validation via `offer-draft.schema.ts` (Zod); review step shows readiness checklist; publish blocked until `name` (+ arbiter when required).
- New version flow: clone sets `publishedOfferId` → publish uses `offer_update`; first publish uses `offer_publish`.
- Disclosures on legal step: `legal_ref` not versioned, immutable published versions.

## Private lists (`/business/manage/...`)

- `/business/manage/offers/drafts` | `published` | `retired` — offers only (`kind=offer`)
- `/business/manage/requests/drafts` | `published` | `retired` — requests only (`kind=request`)

Both merge obl-drafts API + `searchOblOffers` with `author` + `status=all`.

- Left nav: **Offers** and **Requests** (management, not discover).
- Content tabs: **Drafts** | **Published** | **Retired** — each tab has its own URL.
- **Create new offer** / **Create new request** in page header actions.
- `/business/manage/offers/new` and `/business/manage/requests/new` create drafts with fixed kind; editor basics step shows kind as read-only.
- Legacy `/business/offers/*` and `/business/requests/*` manage paths redirect to `/business/manage/...`.

## Offer detail (`/business/manage/offers/:offerId`)

Retire (`buildRetireOfferOp`), new version (clone fields into new draft). Links to public sign page.

## Public sign

- `/offers/:id/versions/:v`, `/requests/:id/versions/:v` — unchanged.
- Sign page — mandatory ledger + auto-payment disclosures before `buildSignContractOp`. If viewer already signed this offer with the author, sign form is hidden. Counterparty supplies `metadata` via guided fields when `terms.signParams` is set, else optional JSON textarea.
