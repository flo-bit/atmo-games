# api.atmo.games

Cloudflare Worker running the public Contrail service for atmo.games. Records remain in their authors' AT Protocol repositories; the Worker indexes them in D1 and serves typed XRPC queries.

## Public endpoints

```text
https://api.atmo.games/.well-known/contrail
https://api.atmo.games/.well-known/did.json
https://api.atmo.games/lexicons
https://api.atmo.games/status
```

Collection reads, profiles, and `games.atmo.getCursor` are anonymous. `games.atmo.notifyOfUpdate` uses AT Protocol service auth with audience `did:web:api.atmo.games#contrail`.

## Initial Cloudflare setup

Create a fresh production database:

```bash
pnpm --dir api exec wrangler d1 create atmo-games-contrail-g20260827
```

Copy the returned database ID into [`wrangler.jsonc`](wrangler.jsonc), then deploy and backfill:

```bash
pnpm api:check
pnpm api:deploy
pnpm --dir api backfill:remote
pnpm contrail:update:prod
```

The final command validates the deployed public service, creates or updates `contrail.lock.json`, and switches the web app's generated client to `https://api.atmo.games`.

## Development

```bash
pnpm api:dev
pnpm --dir api backfill:dev
pnpm dev:local
```

Or start the local API and web app together with `pnpm dev:stack`. Local Contrail data is stored in the repository's ignored `.contrail/` directory.

## Updating the contract

After changing `src/contrail.config.ts`:

```bash
pnpm --dir api lexicons:all
pnpm contrail:generate
pnpm api:check
```

Deploy the API before running `pnpm contrail:update:prod` so the production provider lock is derived from the live service.
