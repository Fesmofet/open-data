---
id: web-business-offers
title: Business — offers & requests
description: Draft editor, publish/retire, and public discovery routes.
type: spec
status: active
scope: web
tags: [web, business, offers]
updated_at: 2026-07-14
related:
  - docs/apps/web/spec/pages/business/overview.md
---

# Business — offers & requests

**Back:** [Business overview](overview.md)

## Draft editor (`/business/offers/drafts/:draftId`)

- Eight steps (`OFFER_EDITOR_STEPS` in `offer-form.types.ts`); debounced PATCH autosave (~800ms).
- All steps have real fields: basics (incl. tags), service (`service_ref`), commercial (`terms`), billing, termination, disputes, legal (`legal_ref` + off-chain `legalText`).
- **Full preview:** header button opens scrollable modal; **Open in new tab** → `/business/offers/drafts/:draftId/preview`.
- Publish validation via `offer-draft.schema.ts` (Zod); review step shows readiness checklist; publish blocked until `name` (+ arbiter when required).
- New version flow: clone sets `publishedOfferId` → publish uses `offer_update`; first publish uses `offer_publish`.
- Disclosures on legal step: `legal_ref` not versioned, immutable published versions.

## Private list (`/business/offers`)

Merges obl-drafts API + `searchOblOffers` with `author` filter. Tabs: Drafts, Published, Retired.

## Offer detail (`/business/offers/:offerId`)

Retire (`buildRetireOfferOp`), new version (clone fields into new draft). Links to public page.

## Public routes

- `/offers`, `/requests` — `searchOblOffers` with `kind`; optional query params `author` (Hive account) and `q` (name/description search).
- Business overview and avatar menu link to `/offers`; Relationships empty state links to `/offers` (not `/business/offers`).
- Sign page — mandatory ledger + auto-payment disclosures before `buildSignContractOp`.
