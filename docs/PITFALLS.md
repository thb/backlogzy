# Pièges rencontrés (journal vivant)

Chaque galère rencontrée sur ce boilerplate (ou en utilisant la skill sur un projet) est consignée ici avec
sa correction. But : que le golden path devienne de plus en plus robuste. Les plus structurants sont aussi
encodés dans la skill `dev-fullstack-ruby-react`.

> **Règle** : dès qu'un nouveau piège coûte du temps, l'ajouter ici (symptôme → cause → fix). Si largement
> applicable, le remonter aussi dans la skill.

---

## Setup / Git

### `rails new --skip-git` produit un `.gitignore` quasi vide
- **Symptôme** : `config/master.key`, `credentials.yml.enc`, `log/*.log` et le cache `tmp/cache/bootsnap` (des
  milliers de fichiers) se retrouvent trackés.
- **Cause** : `--skip-git` n'écrit pas le `.gitignore` standard de Rails.
- **Fix** : poser le `.gitignore` Rails complet **avant** le premier `git add`. Vérifier `git ls-files` (aucun
  `log/`, `tmp/cache`, `master.key`). Si déjà committé : purger l'historique (`git filter-branch`/`filter-repo`).

### Décision : pas de Rails credentials — secrets via `.env`
- **Choix assumé** (pas un contournement) : ce boilerplate n'utilise **pas** `credentials.yml.enc` / `master.key`.
  Tous les secrets passent par un **`.env`**, chargé au niveau du shell par le plugin `dotenv` d'oh-my-zsh
  (donc lu dans `ENV`), et `secret_key_base` est lu depuis `SECRET_KEY_BASE`.
- **Pourquoi** : préférence de Thomas — pas à l'aise avec le couple credentials chiffrés + `master.key`
  (clé à committer/partager hors git, rotation pénible, contenu peu lisible/diffable). Le `.env` est explicite,
  simple à faire varier par environnement, et homogène dev / CI / prod.
- **Conséquences / garde-fous** : **pas** de gem `dotenv-rails` (le shell s'en charge déjà) ; `.env*` gitignoré,
  seul `.env.example` est committé ; en prod le `.env` vit à côté du `docker-compose.prod.yml` sur le serveur
  (jamais en git). Au `rails new`, retirer toute référence aux credentials et vérifier que `master.key` n'est
  pas tracké (cf. piège `.gitignore` ci-dessus).

---

## Backend (test / runtime)

### Blacklist JWT inopérante en test
- **Symptôme** : les tests de logout/refresh échouent silencieusement.
- **Cause** : `config.cache_store = :null_store` en test → `Rails.cache` ne stocke rien.
- **Fix** : `:memory_store` en test (la blacklist `jti` utilise `Rails.cache`).

### Pagy : `expected :page >= 1; got 0`
- **Symptôme** : 500 sur l'index quand `page` est vide (`?page=`, envoyé par rswag ou un navigateur).
- **Cause** : Pagy parse `""` en `0`.
- **Fix** : `pagy(scope, page: params[:page].presence || 1, limit: …)`.

---

## Frontend

### `routeTree.gen.ts` manquant au build sur un clone neuf
- **Symptôme** : `npm run build` (`tsc -b && vite build`) échoue car `tsc` tourne avant que le plugin TanStack
  Router n'ait généré `src/routeTree.gen.ts`.
- **Fix** : **committer** `routeTree.gen.ts` (et l'ignorer dans eslint). Il est régénéré au `vite dev`.

### Champs select/multiselect uncontrolled
- **Symptôme** : 500 Postgres `invalid input syntax for type uuid: ""` quand un select vide est soumis.
- **Cause** : un `<select>` vide envoie `""` → assigné à une FK uuid.
- **Fix** : coercer `""` → `null` avant l'envoi (FK + enums). Lire le multi-select via `FormData.getAll(name)`
  (array) et la checkbox via `fd.get(name) != null` (bool). Les options viennent de collections account-scoped
  (modèles read-only, ex. industries/tags) chargées en TanStack Query.

### `res.json()` crashe sur une réponse 2xx au corps vide
- **Symptôme** : un appel API qui réussit (ex. `POST forgot` → **202**, `204`) affiche « Something went wrong »
  côté front.
- **Cause** : le client ne gérait le vide que pour `204` → `res.json()` sur un corps vide (202) lève
  `Unexpected end of JSON input`.
- **Fix** : lire `res.text()` puis `JSON.parse` **seulement si non vide** ; sinon retourner `undefined`.

### Emails transactionnels (Scaleway TEM)
- SMTP `smtp.tem.scaleway.com:587`, **login = Project ID**, **password = clé secrète API** (la même que pour
  S3). Le **domaine d'envoi doit être vérifié** dans TEM (`scw tem domain list`) — sinon refus. Envoi async via
  good_job (`deliver_later`). `MAIL_FROM` doit être sur le domaine vérifié.

### letter_opener ne s'ouvre pas en dev (avec good_job)
- **Symptôme** : en dev, `deliver_later` n'ouvre pas l'email dans le navigateur (letter_opener semble inactif).
- **Cause** : `config.good_job.execution_mode = :async` en dev → le mail part dans le worker (polling DB +
  thread de fond) → l'ouverture du navigateur ne se déclenche pas de façon fiable.
- **Fix** : en **dev**, `config.good_job.execution_mode = :inline` → le job s'exécute synchroniquement dans la
  requête → letter_opener ouvre immédiatement. (Prod garde `:async`, test garde l'adapter `:test`.)

### `t.references` crée déjà un index → ne pas en ajouter un second
- **Symptôme** : `PG::DuplicateTable: relation "index_xxx_on_yyy" already exists` pendant `create_table` →
  migration partielle (table créée mais version non enregistrée, donc « pending » au re-run).
- **Cause** : `t.references :account` génère **par défaut** `index_xxx_on_account_id`. Un
  `add_index :xxx, :account_id` derrière fait doublon.
- **Fix** : porter les options **sur la référence** — `t.references :account, ..., index: { unique: true }` — et
  ne pas rajouter d'`add_index` sur la même colonne. Pour rejouer après un échec partiel : nettoyer la table
  orpheline via l'API Rails (`ActiveRecord::Migration.drop_table(:xxx, if_exists: true)` en `rails runner`, **pas
  de SQL brut**) puis `db:migrate`.

### Migration partielle → `PG::DuplicateColumn` au re-run
- **Symptôme** : une migration interrompue a ajouté la colonne mais pas enregistré sa version → re-run échoue
  (`column already exists`), statut reste `down`.
- **Fix** : `add_column ..., if_not_exists: true` (+ `add_index ..., if_not_exists: true`) pour rendre la
  migration idempotente, puis rejouer.

### Typage des mutations dans les composants de form partagés
- **Symptôme** : `UseMutationResult<…, never, …>` n'accepte pas une mutation concrète (variance invariante via
  `mutate`).
- **Fix** : typer le prop par le minimum utilisé — `{ error: Error | null; isPending: boolean }`.

---

## Production (Rails 8) — les plus coûteux

### `database.yml` prod par défaut ignore `DATABASE_URL`
- **Symptôme** : le conteneur reboucle, `db:prepare` tente une connexion **socket** (`/var/run/postgresql/...`).
- **Cause** : le `production:` généré = 4 bases (primary/cache/queue/cable) avec `database:`/`username:` explicites
  (socket), pas `url:`.
- **Fix** : **base unique** → `production: { <<: *default, url: <%= ENV["DATABASE_URL"] %> }`.

### La trio Solid exige des bases dédiées au boot
- **Symptôme** : `ActiveRecord::AdapterNotSpecified: The 'cable' database is not configured` (solid_cable au boot).
- **Cause** : `solid_cache`/`solid_queue`/`solid_cable` se connectent à leurs bases (`cache`/`queue`/`cable`) qui
  n'existent pas en base unique.
- **Fix** : **retirer la trio Solid** (gems + `db/*_schema.rb` + `config/{cache,queue,cable,recurring}.yml` +
  `bin/jobs` + `plugin :solid_queue` dans `puma.rb`). Cache `:memory_store`, jobs via **good_job**.

### Seeds non joués en prod
- **Symptôme** : `users=0` après déploiement, login KO.
- **Cause** : `db:prepare` ne lance les seeds **que** s'il crée la base. Le conteneur Postgres l'a déjà créée
  (`POSTGRES_DB`).
- **Fix** : seed one-time manuel (`docker exec <app>-api bin/rails db:seed`). Volume persistant → une seule fois.
  (Vraie app : ne pas seeder de données de démo en prod.)

### good_job en prod
- **Setup** : `queue_adapter :good_job` global ; `config.good_job.execution_mode = :async` en prod (scheduler
  dans Puma, pas de worker séparé) ; adapter `:test` en test pour garder `have_enqueued_job`.

---

## Déploiement / Cloudflare

### Déployer le back avant le front
- **Fix** : `deploy-front` guardé par `vars.CLOUDFLARE_PROJECT != ''` → le back peut partir en live avant que
  Cloudflare ne soit configuré.

### Custom domain Pages
- **Note** : `POST /pages/projects/<p>/domains` enregistre le domaine ; pour une zone du même compte, créer aussi
  le CNAME `<sub>` → `<project>.pages.dev` (proxied). DNS du back = A vers l'IP serveur, **gris** (DNS only) pour
  laisser Traefik gérer Let's Encrypt.

### Image GHCR privée
- **Note** : le serveur doit être loggé à GHCR (`docker login ghcr.io`) avec un token qui lit le package. CI :
  build+push via `GITHUB_TOKEN` (`packages: write`).

---

## OAuth (config côté provider)

### Le redirect URI = le callback de l'API (server-side), pas le front
- **Symptôme** : `redirect_uri_mismatch` (Google) / « The redirect_uri MUST match » (GitHub) au retour de login.
- **Cause** : on configure le front, ou les « origines JavaScript autorisées », au lieu du callback **serveur**.
  Notre flow est server-side (OmniAuth) : le provider redirige vers l'**API**, jamais vers le SPA.
- **Fix** : déclarer le callback de l'API, chemin **propre à chaque provider** (omniauth), match **exact**
  (schéma + host + chemin, **sans slash final**) :
  - Google : `https://<API_HOST>/auth/google_oauth2/callback`
  - GitHub : `https://<API_HOST>/auth/github/callback`
  Les « Origines JS » (Google) ne servent **pas** au flow server-side. GitHub OAuth App : un seul champ
  « Authorization callback URL », **Device Flow désactivé** (réservé aux appareils sans navigateur).

### Caractère parasite collé en tête d'un Client ID / secret
- **Symptôme** : le provider rejette l'auth ; dans la redirection, `client_id=%E2%80%A6389670...`
  (`%E2%80%A6` = `…` UTF-8). En manipulant la valeur sous zsh : `bad math expression: illegal character`.
- **Cause** : un `…` (troncature d'un affichage copié) ou une espace s'est glissé en tête de la valeur.
- **Fix** : nettoyer la valeur (retirer tout caractère non `[0-9A-Za-z]` en tête) avant de l'écrire dans `.env`.
  Vérifier le request phase : `curl -sI https://<API_HOST>/auth/<provider>` doit renvoyer **302** vers le
  provider avec un `client_id` propre et le bon `redirect_uri`.

---

## Uploads de fichiers

### Pas d'Active Storage — direct-to-S3 présigné
- **Décision** : ne PAS utiliser Active Storage. Uploads en **direct-to-S3 présigné** (aws-sdk + bucket Scaleway).
- **Retirer Active Storage proprement** : rollback + suppression de la migration `create_active_storage_tables`,
  retirer les `require "active_storage/engine"` / `action_text` / `action_mailbox` de `application.rb` (les deux
  derniers dépendent d'AS), retirer `config.active_storage.service` des environnements, supprimer `storage.yml`.
- **Pattern** : `POST /v1/uploads {filename, content_type}` → `{ key, url }` (presigned PUT, type whitelisté
  côté serveur) ; le navigateur PUT direct vers Scaleway (Content-Type = celui du fichier) ; le modèle stocke
  la `*_key` ; le blueprint renvoie une URL GET présignée (`*_url`).
- **Bucket** : CORS autorisant `PUT` (et `GET`) depuis l'origine du SPA, sinon le PUT navigateur est bloqué.
- **Specs** : le presign est une opération **locale** (pas de réseau) → des creds factices suffisent en test.

### `presign_get` plante quand S3 n'est pas configuré
- **Symptôme** : `KeyError: SCALEWAY_ACCESS_KEY` lors du rendu d'une réponse contenant un `*_url` (ex.
  `avatar_url`/`logo_url`) sur un environnement sans creds (test, dev sans S3).
- **Fix** : `S3Storage.presign_get` **dégrade en `nil`** si `!configured?` (au lieu de `ENV.fetch`). Les
  réponses ne crashent jamais sans creds ; l'endpoint d'upload renvoie un 503 clair si non configuré.

---

## Multi-tenant / changement de compte

### Le switch de compte ne met pas à jour le header (slug non réactif)
- **Symptôme** : on choisit un autre compte dans le user menu ; les données peuvent suivre, mais le **label
  du compte dans le header reste figé** sur l'ancien → impression que « ça ne change pas de compte ».
- **Cause** : le slug courant vit dans `localStorage` (`tokens.account()`), qui n'est **pas réactif**. Le
  header lit `currentMembership(user)` au render ; un `qc.invalidateQueries()` + `navigate()` ne re-render pas
  forcément `AppLayout` (React Query, avec le tracking de propriétés, ne re-render pas si la query `me`
  refetchée renvoie des **données identiques** → même référence ; et un changement de route enfant ne
  re-exécute pas le composant de layout parent).
- **Fix** : au switch, **recharger la page** — `window.location.assign("/dashboard")` après `tokens.setAccount(slug)`.
  Tout se réinitialise avec le nouveau header `X-Account` (header, nav, isAdmin, et toutes les queries
  account-scoped). C'est aussi l'approche des fronts de prod. Couvert par `spec/features/account_switch_spec.rb`.
