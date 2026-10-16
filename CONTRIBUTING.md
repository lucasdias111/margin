# Contributing to margin

Thanks for helping. Bug reports, docs fixes, translations of confusing error messages into plain ones, and code are all welcome.

- **Questions and bugs:** open an [issue](https://github.com/lucasdias111/margin/issues). Search the existing ones first, and for a bug say which version you run (it's in the admin section, and in `MARGIN_VERSION` in `.env`).
- **Security problems:** please don't open a public issue. Use GitHub's [private vulnerability reporting](https://github.com/lucasdias111/margin/security/advisories/new) instead.
- **Code:** send a pull request. For anything bigger than a fix, open an issue first so we can agree on the approach before you spend time on it.

## License of contributions

margin is licensed under the [AGPL-3.0-only](LICENSE), and contributions are accepted under that same license: inbound equals outbound. By sending a pull request you agree that your contribution is licensed under AGPL-3.0-only.

There is **no CLA** and **no DCO sign-off**. You keep the copyright to your contribution, and you're credited through the git history. Don't add per-file license headers; the root [`LICENSE`](LICENSE) covers the whole repository.

## Repository layout

| Folder | Stack | Tests |
|---|---|---|
| [`server/`](server/) | Java 25, Spring Boot, Maven wrapper | `./mvnw test` (needs Docker for Testcontainers) |
| [`client/`](client/) | Node 22, Svelte 5, Vite, Electron | `npm test` (vitest) |
| [`sfu/`](sfu/) | Node 22, TypeScript, mediasoup | `npm test` |
| [`deploy/`](deploy/) | POSIX sh, Docker Compose | run it; see below |

## Dev setup

You need Java 25, Node 22 and Docker. The server's `dev` profile ([`application-dev.yml`](server/src/main/resources/application-dev.yml)) expects a few services on localhost. Start them once:

```sh
docker run -d --name margin-dev-db -p 5433:5432 \
  -e POSTGRES_DB=margindb -e POSTGRES_USER=sysuser -e POSTGRES_PASSWORD=admin123 postgres:17-alpine
docker run -d --name margin-dev-s3 -p 9000:9000 -p 9001:9001 \
  minio/minio server /data --console-address :9001
docker run -d --name margin-dev-mail -p 2525:1025 -p 8025:8025 axllent/mailpit
```

Create a bucket called `margin` in the MinIO console at http://localhost:9001 (login `minioadmin` / `minioadmin`). Mail the server sends shows up in Mailpit at http://localhost:8025.

Then run each part in its own terminal:

```sh
# server, on :8080 (REST), :8081 (WebSocket) and :9090 (health)
cd server
SPRING_PROFILES_ACTIVE=dev SFU_PUBLIC_URL=ws://localhost:3000 ./mvnw spring-boot:run

# sfu, on :3000 (signaling) and :40000 (media)
cd sfu
npm ci
PUBLIC_IP=127.0.0.1 SFU_SECRET=dev-secret-sfu-key-not-for-production-use-only \
  INTERNAL_API_KEY=dev-internal-api-key-not-for-production-use-only npm run dev

# web app, on http://localhost:5274
cd client
npm ci
npm run dev:web
```

In development the web app talks to the server at `http://localhost:8080` directly; in production it uses same-origin `/api`, `/ws` and `/sfu` behind Caddy. The dev profile has registration open and email verification off, and the server logs a first-admin setup link on its first start.

To work on the **desktop shell**, run `npm run dev` in `client/` and add `http://localhost:5274` as a server (plain http is allowed for localhost). [Building the desktop app](docs/building-desktop.md) covers packaging.

To try the **deploy bundle** against images you built yourself, build them from the repository root:

```sh
docker build -t ghcr.io/lucasdias111/margin-server:dev server
docker build -t ghcr.io/lucasdias111/margin-sfu:dev sfu
docker build -t ghcr.io/lucasdias111/margin-web:dev -f client/Dockerfile.web client
```

then copy `deploy/compose.yml`, `deploy/.env.example` (as `.env`, with `MARGIN_VERSION=dev` and secrets filled in) and `deploy/coturn/` into a scratch folder and run `docker compose up -d`. To go through the installer instead, put `compose.yml`, `coturn/turnserver.conf.template`, `backup.sh` and `restore.sh` side by side in one folder (flat, as a release ships them) and run `MARGIN_BUNDLE_URL=file:///path/to/that/folder sh deploy/install.sh --version dev --dir /tmp/margin-test`.

## Before you send a pull request

- Run the tests for each folder you touched. In `client/`, also run `npm run lint` and `npm run typecheck`.
- Keep a pull request to one change, and say in its description what it does and how you checked it.
- If it changes behaviour an operator would notice (a new `.env` setting, a changed port, a migration that needs a manual step), update [`docs/`](docs/README.md) and add a line under `## [Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md). Breaking changes need a new major version, so call them out.
- Database changes go in a new Flyway migration in `server/src/main/resources/db/migration`; never edit one that's already released.
