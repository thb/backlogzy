# Déploiement

Le workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) est **générique** (le template) ;
tout ce qui est propre au projet vit dans les **GitHub Secrets/Variables** et le **`.env` serveur** — jamais
committé. Un repo non configuré reste vert : les jobs de deploy sont **skippés** tant que la variable
`DEPLOY_ENABLED` n'est pas à `true`.

```
push main ──▶ deploy-back   : build Docker (back/) → GHCR (tag :sha + :latest) → SSH → docker compose pull/up
          └─▶ deploy-front  : npm build (VITE_API_URL) → Cloudflare Pages
```

Le back auto-migre au boot (l'entrypoint Rails lance `db:prepare`).

---

## 1. GitHub — Secrets & Variables

**Secrets** (valeurs sensibles) :

| Secret | Usage |
|--------|-------|
| `SSH_HOST` | hôte du serveur de deploy (ex. `rdmpr-four`) |
| `SSH_USER` | user SSH (ex. `deploy`) |
| `SSH_PRIVATE_KEY` | clé privée du deploy user (clé dédiée par service, pas passe-partout) |
| `CLOUDFLARE_API_TOKEN` | token Cloudflare avec scope *Pages: Edit* |
| `CLOUDFLARE_ACCOUNT_ID` | account ID Cloudflare |

> GHCR : pas de secret à créer — le workflow s'authentifie avec le `GITHUB_TOKEN` (permission `packages: write`).

**Variables** (non sensibles) :

| Variable | Exemple | Usage |
|----------|---------|-------|
| `DEPLOY_ENABLED` | `true` | interrupteur : active les jobs de deploy |
| `DEPLOY_APP_DIR` | `backlogzy` | dossier `~/docker/<dir>` sur le serveur |
| `API_URL` | `https://api.backlogzy.roadmapper.fr` | `VITE_API_URL` injecté au build front |
| `CLOUDFLARE_PROJECT` | `backlogzy` | nom du projet Cloudflare Pages |

Mise en place via `gh` (depuis le repo) :

```bash
gh variable set DEPLOY_ENABLED   --body "true"
gh variable set DEPLOY_APP_DIR   --body "backlogzy"
gh variable set API_URL          --body "https://api.backlogzy.roadmapper.fr"
gh variable set CLOUDFLARE_PROJECT --body "backlogzy"

gh secret set SSH_HOST            --body "rdmpr-four"
gh secret set SSH_USER            --body "deploy"
gh secret set SSH_PRIVATE_KEY     < ~/.ssh/id_deploy        # clé privée dédiée
gh secret set CLOUDFLARE_API_TOKEN  --body "…"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "…"
```

---

## 2. Serveur (back) — une fois par app

L'image GHCR est tirée par un compose qui vit sur le serveur. Modèle :
[`back/docker-compose.prod.yml`](../back/docker-compose.prod.yml).

```bash
ssh deploy@rdmpr-four
mkdir -p ~/docker/backlogzy && cd ~/docker/backlogzy

# 1. Copier le compose de prod (depuis le repo) ici, en docker-compose.prod.yml
#    (scp, ou coller le contenu de back/docker-compose.prod.yml)

# 2. Authentifier le serveur à GHCR (PAT avec scope read:packages)
echo "$GHCR_PAT" | docker login ghcr.io -u thb --password-stdin

# 3. Créer le .env (NON committé) à côté du compose
cat > .env <<'EOF'
IMAGE=ghcr.io/thb/backlogzy-back:latest
APP=backlogzy
API_HOST=api.backlogzy.roadmapper.fr
SECRET_KEY_BASE=        # `cd back && bin/rails secret` ou `openssl rand -hex 64`
DB_PASSWORD=            # mot de passe Postgres
CORS_ORIGINS=https://backlogzy.roadmapper.fr
# Uploads direct-to-S3 (Scaleway). Le bucket doit avoir un CORS autorisant PUT depuis CORS_ORIGINS.
SCALEWAY_ACCESS_KEY=
SCALEWAY_SECRET_KEY=
SCALEWAY_BUCKET_NAME=
SCALEWAY_REGION=fr-par
# Transactional email (Scaleway TEM). SMTP_USERNAME = Project ID, SMTP_PASSWORD = API secret key.
SMTP_ADDRESS=smtp.tem.scaleway.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_DOMAIN=roadmapper.fr
MAIL_FROM=noreply@roadmapper.fr
FRONT_URL=https://backlogzy.roadmapper.fr
# OAuth (login only) — apps créées dans Google Cloud / GitHub (callback <API>/auth/<provider>/callback)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
EOF
chmod 600 .env

# 4. Premier boot (db:prepare migre automatiquement)
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f app
```

> **Seed initial (one-time, optionnel)** : `db:prepare` ne joue PAS les seeds quand la base existe déjà
> (le conteneur Postgres la crée). Pour des données de démo (compte `acme`, `admin@example.com`/`password`) :
> `docker exec <app>-api bin/rails db:seed`. Le volume Postgres étant persistant, à faire une seule fois.
> (Pour une vraie app : adapter `db/seeds.rb`, ne pas seeder de données de démo en prod.)

**Traefik** : le réseau `web` du compose doit correspondre au réseau Traefik du serveur (le renommer si besoin).
Le routeur écoute `Host(API_HOST)` sur `websecure` avec le resolver `letsencrypt` (SSL auto).

---

## 3. Cloudflare Pages (front) — une fois

1. Créer un projet Cloudflare Pages nommé comme `CLOUDFLARE_PROJECT` (en *Direct Upload* — le déploiement
   se fait par le workflow, pas par l'intégration Git de Cloudflare).
2. Token API Cloudflare avec la permission **Cloudflare Pages: Edit** → `CLOUDFLARE_API_TOKEN`.
3. Récupérer l'`Account ID` (dashboard Cloudflare) → `CLOUDFLARE_ACCOUNT_ID`.
4. Mapper le domaine front (Custom domain) côté Cloudflare Pages.

> SPA : Cloudflare Pages sert `index.html` en fallback pour les routes côté client par défaut. Si besoin,
> ajouter un `front/public/_redirects` avec `/*  /index.html  200`.

---

## 4. Activer / déployer

Une fois les secrets/variables posés et le serveur prêt :

```bash
git push origin main      # déclenche CI puis Deploy (deploy-back + deploy-front)
```

Sans `DEPLOY_ENABLED=true`, seul le CI tourne (les jobs deploy sont skippés) — c'est le mode « template ».

---

## 5. Réutiliser pour un nouveau projet

1. Copier/cloner le boilerplate, renommer.
2. Créer le repo, pousser.
3. Poser les Secrets/Variables (section 1) — le nom d'image GHCR se déduit automatiquement du repo
   (`ghcr.io/<owner>/<repo>-back`).
4. Préparer le serveur (section 2) + le projet Cloudflare (section 3).
5. `DEPLOY_ENABLED=true`, push → live.

> Rotation des secrets (SSH, tokens) : tous les 90 j ; immédiate si compromis. Voir la skill `secops`.
