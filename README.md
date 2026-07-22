# Backlogzy 🍅

A productive backlog manager — boards per project, weekly planning with pomodoros
and habit tracking. Multi-tenant SaaS built on the Rails 8 + React 19 golden path.

- **Prod** : https://backlogzy.roadmapper.fr (front) · https://api.backlogzy.roadmapper.fr (API)

## Architecture

```
backlogzy/
├── back/      # Rails 8 API-only — controllers/v1, models, blueprints/v1, services
└── front/     # React 19 SPA — Vite, TanStack Router/Query, Tailwind v4
```

Auth JWT (access 4h / refresh 30j) + OAuth Google/GitHub · multi-tenant via header
`X-Account` · invitations membres · emails transactionnels (Scaleway TEM) ·
jobs good_job · doc OpenAPI rswag sur `/api-docs`.

## Dev

```bash
# Postgres local requis (ou `docker compose up -d`)
cd back && bundle install && bin/rails db:create db:migrate db:seed && cd ..
cd front && npm install && cd ..
./bin/dev            # back :3000, front :5173
```

Login de seed : `admin@example.com` / `password` (account `acme`).

## Gates

```bash
cd back  && bundle exec rspec
cd back  && RAILS_ENV=test bundle exec rake rswag:specs:swaggerize
cd front && npm run typecheck && npm run lint && npm run build
```

## Déploiement

Push sur `main` → GitHub Actions : back en image Docker → GHCR → SSH sur rdmpr-four ;
front → Cloudflare Pages. Voir [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
