# Changelog

All notable changes to rhost-vision are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

_Nothing yet._

---

## [1.1.0] — 2026-03-21

### Added

- **`score.ts`** — New system script override. Displays a formatted scorecard
  for the calling player: DBRef, alias, money, flags, short-desc, doing.
  Supports a customisable stat block via `&SCORE-EXTRA me=<text>`.
- **`examine.ts`** — New system script override. Full object examination —
  flags, owner, lock, location, home, channels, and all non-system attributes.
  Respects the VISUAL flag for non-owner access.
- **`inventory.ts`** — New system script override. Lists everything the player
  is carrying with inline short descriptions, in Rhost-style bordered output.
- **`+staff`** (`staff.ts`) — New native command. Lists all online,
  non-dark staff members (admin / wizard / superuser) with On For, Idle, and
  Doing columns. Registered via `registerStaffCommands()`.
- **`layout.ts`** — Shared layout-utility library for native commands.
  Exports: `visibleLength`, `padLeft`, `padRight`, `padCenter`, `header`,
  `footer`, `divider`, `wrap`, `columns`, `nColumns`, `bar`, `sheet`, `table`.
  Pure functions — no SDK dependency.
- **`theme.ts`** — Centralised theme configuration (`RhostTheme` interface,
  `defaultTheme`, `customTheme`). Edit this file to change colours, widths,
  and layout options; changes apply to all native commands at startup.
- **`CONTRIBUTING.md`** — Contributor guide (setup, code style, commit
  conventions, PR process, bug reports, feature requests).
- **`CHANGELOG.md`** — This file.

### Changed

- `index.ts` — Updated to `v1.1.0`. Adds `score.ts`, `examine.ts`, and
  `inventory.ts` to the list of script overrides. Imports and calls
  `registerStaffCommands()`. Adds `Deno.mkdir` call to ensure `system/scripts/`
  exists before installation. The `remove()` function now also deletes the
  `.original.ts` backup after restoring, keeping the scripts directory clean.
- `ursamu.plugin.json` — Version bumped to `1.1.0`. Description expanded.
  Added `contributors` and `ursamu` (minimum engine version `>=1.8.0`) fields.

---

## [1.0.0] — initial release

### Added

- `look.ts` — Rhost-style room display: bordered header/footer, categorised
  exits (Locations vs Directions), player idle times, short descriptions.
- `who.ts` — WHO list with On For, Idle, and Doing columns; sorted by login
  time; `name_color` support.
- `where.ts` — `+where` command grouping online players by area/zone.
- `mail.ts` — Full MUSH-style mail system: draft, reply, forward, CC/BCC,
  starred messages, status flags `[URFS----]`.
- `page.ts` — Page command with pose syntax and alias display.
- `finger.ts` / `+finger` — Player profile command with settable fields,
  hidden fields, dot-leader formatting, and `name_color` integration.
- `ooc.ts` / `ooc` — Out-of-character talk with customisable colour tags
  (`+ooccolor`, `+ooccolor2`).
- `namecolor.ts` / `+namecolor` — Staff command to colour the first letter of
  a character name; supports ANSI codes and hex `#RRGGBB`.
- `emit.ts` / `@emit` — Staff-only room broadcast command.

[Unreleased]: https://github.com/chogan1981/ursamu-rhost-vision/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/chogan1981/ursamu-rhost-vision/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/chogan1981/ursamu-rhost-vision/releases/tag/v1.0.0
