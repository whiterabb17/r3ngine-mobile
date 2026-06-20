# r3ngine-mobile — Feature Parity Roadmap

Living roadmap for closing the gap between the r3ngine v3 frontend (web) and the mobile companion. Items are grouped into four phases; each phase becomes its own design spec → implementation plan cycle.

Reference baseline: mobile **v1.4.1** (compatible with core v3.5.0+) vs frontend at **v3.7.0**.

---

## Phase 1 — v3.7.0 Intelligence Layer ✅ COMPLETE (shipped v1.5.0)

The intelligence features that shipped in v3.7.0 have no mobile representation today.

1. **Exposure Correlation** — `features/exposures/` (ExposureList, ExposureCard, ExposureDetailsDrawer, status filter chips, aggregate stats bar, evidence key-value rendering, linked vulns).
2. **APME Attack Tree Viewer + Risk/Impact** — full AttackTreeViewer (replacing flat list), RiskSummaryBar, PriorityBadge, ImpactExplorer, speculative paths section, LEAF detectability chip, score tooltip.
3. **Certificate Intelligence** — `features/certificates/` CertIntelTab (cert chain, SAN viewer, issuer, fingerprints).
4. **Identity Infrastructure** — `features/identity/` IdentityInfraPanel (IdP discovery, URL/title/header detection results).

## Phase 2 — Graph & API Intelligence

5. **API Intelligence + Expanded Graph** — Application/Organization nodes, distinct node colors, `/api/graph/chain/` endpoints, DEPENDS_ON / TRUSTS_DOMAIN / PART_OF edges, APIIntelligenceProfile.

## Phase 3 — Workflow & Org Surfaces

6. **Bounty Hub** — `features/bounty/BountyHubPage` (program management).
7. **Global Search** — `features/search/SearchPage` (cross-entity search with query persistence).
8. **Plugin Management** — full plugin install/enable/configure/uninstall page (not just per-scan selector).
9. **Todos** — `features/todos/TodoPage`.
10. **Projects Switcher** — multi-project context (`/$projectSlug/...` URL pattern).
11. **Workflows** — `features/workflows/` orchestration UI.
12. **Profiles** — `features/profiles/` saved hunting profiles.

## Phase 4 — Scan Pipeline & Pipeline Builders

13. **Scans split** — Scheduled Scans (verify mobile parity), Sub Scans top-level page, Attack Surface page, AI scan export action, scan detail action menu.
14. **Pipeline Builders with tier badges** — tier_1..tier_7 stage rendering, theme-token colors.

## Phase 5 — Settings Expansion & Workers

15. **Settings sub-pages** — OpSec, Tool Settings, Tool Arsenal, API Vault, LLM Toolkit, Report Settings, ReNgine Settings, Notification Settings (verify), Admin, **Remote Workers** (distributed worker infrastructure UI).

---

## Process

Each phase ships in its own loop:

1. Brainstorm → design spec under `r3ngine-mobile/docs/superpowers/specs/YYYY-MM-DD-phaseN-<topic>-design.md`.
2. Writing-plans → implementation plan with checkpoints.
3. Execute → land features, update [CHANGELOG.md](../CHANGELOG.md), bump mobile minor version, update README compatibility badge.

## Notes

- Mobile API client is centralized in [src/api/client.ts](../src/api/client.ts); add new modules under `src/api/` mirroring backend `/mapi/` namespace.
- New screens go under `app/<area>/` per Expo Router file-based convention; cross-link from a tab if user-facing primary, otherwise stack-only.
- Reuse `src/components/` subfolders (Intelligence, System, Scan, Target, Tools, Dashboard, Observability) — add new folders only for net-new areas (Exposures, Certificates, Identity, Bounty, Plugins, Workflows).
- Every new screen must respect the **PII gate**, use Theme tokens (no hardcoded colors), and pass JWT via Bearer header (WebSocket via `?token=` query param).
