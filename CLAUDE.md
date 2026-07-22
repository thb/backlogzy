# Backlogzy — monorepo SaaS (Rails 8 + React 19)

Backlog manager multi-tenant (boards, planning hebdo, pomodoros, habitudes).
Issu du boilerplate `~/Projects/sides/boilerplate` — **suivre la skill
`dev-fullstack-ruby-react`** pour toute feature (patterns, gates, conventions).

## Structure

- `back/` — Rails 8 API-only. Domaine : `Project` → `Item` (kind `task`|`separator`,
  position flottante pour l'ordre), `HabitEntry` et `Pomodoro` (scopés account **et**
  user). Import legacy : `ImportBackup` (`POST /v1/import`).
- `front/` — React 19 SPA. `features/backlog` (board full-screen : TopBar, ProjectTabs,
  BacklogTable, DetailPanel), `features/planning` (grille semaine + trackers),
  `features/{admin,settings,notifications}` (pages sous `AppLayout`).

## Spécificités vs boilerplate

- Billing (Lemon Squeezy) **retiré** — à re-greffer depuis le boilerplate si besoin.
- Rôles membership simplifiés : `admin` | `member`.
- `_auth.tsx` = guard nu ; board/planning ont leur layout plein écran (TopBar),
  settings/admin s'enveloppent dans `AppLayout`.
- État vue dans l'URL : `/board?project=&detail=`, `/planning?start=&detail=`.
- Mutations items/projects **optimistes** (édition inline + drag & drop).

## Gates (obligatoires avant de considérer une feature finie)

```bash
cd back  && bundle exec rspec && RAILS_ENV=test bundle exec rake rswag:specs:swaggerize
cd front && npm run typecheck && npm run lint && npm run build
```

## Déploiement

`main` → GitHub Actions → back GHCR + SSH **rdmpr-four** (`~/docker/backlogzy`),
front **Cloudflare Pages** (`backlogzy.roadmapper.fr`). API :
`api.backlogzy.roadmapper.fr`. Infra gérée via `rdmpr-infra` (skill `secops`).
