---
title: Create book object
description: Agent playbook for ODL book — metadata, authors, publisher, commerce.
type: playbook
status: active
scope: platform
tags: [object-create, object-create-playbook, book, agent]
related:
  - docs/skills/object-content-standards.md
  - docs/skills/object-content-routing.md
  - docs/skills/object-create/person.md
---

# Create book object

Book or publication with metadata, authors, and commerce.

## When to use / not

- **Use** for a book or publication with bibliographic metadata.
- **Use** `odl_build_update_create` when the book already exists.
- **Not** for read-only queries — use query-api MCP.

## Product baseline fields

`name`, `description`, `image` (from `get_object_create_playbook.required_updates`).

## Field semantics

| Update | Semantics |
|--------|-----------|
| `name`, `title` | Book title |
| `description` | Synopsis or back-cover text |
| `author` | Object ref(s) to [`person`](person.md) — multi-value |
| `publisher` | Object ref to `business` (imprint / publisher) |
| `identifier` | ISBN or canonical catalog id |
| `datePublished` | Publication date |
| `inLanguage` | Primary language (BCP-47) |
| `printLength` | Page count or length label |
| `price`, `compareAtPrice` | Commerce fields when sold |
| `category` | Shop navigation (e.g. `Books`, genre shelves) |
| `website` | Canonical listing URL |

Schema details: `get_update_schema({ update_type })`.

### Linking authors

`author` is an **object ref** to `person` objects (`applies_to: person`). Do not put author names only in `description` when a `person` profile exists or should exist.

1. Dedupe / create each author as [`person`](person.md) (`name`, `description`, `image` from source).
2. Create or update the `book`.
3. Add `author` updates with each author's `object_id` (multiple authors = multiple `author` rows).

```text
person-jane-doe
person-john-smith
  └─ book-example
        └─ author → person-jane-doe
        └─ author → person-john-smith
```

`author` refs are not localizable — translate names on the `person` object instead.

## Categories and tags (soft)

**Discover tags** (`supposed_updates`):

- `aggregateRating`: `Rating`
- `tagCategory`: `Tags`
- `category`: `Books`

## Locales

Translate `name`, `description`, `title` on the book. Author display names live on linked `person` objects.

See [object content standards](../object-content-standards.md).

## Research and source hierarchy

1. Publisher site, ISBN databases, or library catalog for metadata.
2. Official author pages for biographical `person` fields.
3. Omit unknown ISBN, page count, or publication date — do not invent.

## Images

Cover image on the book (IPFS). Author portraits belong on `person`, not duplicated on the book unless a cover composite is intentional.

## Special constraints

- Dedupe by `identifier` (ISBN) or canonical URL before create.
- Create `person` authors before `author` refs on the book.
- No duplicate object refs in one payload.

## Verification

`resolve_object`:

- `fields.name`, `fields.image` when set
- each `fields.author` ref resolves to `object_type` = `person`
- `fields.identifier` matches source when set

## Related workflows

- [person](person.md) — author profiles
- [business](business.md) — publisher imprint
- [Object content standards](../object-content-standards.md)
