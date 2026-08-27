# atmo.games

Small daily games for AT Protocol accounts. The app is built with SvelteKit and deployed to Cloudflare Workers; Fours puzzles and scores are stored in users' AT Protocol repositories.

## Development

Install dependencies and start the web app:

```bash
pnpm install
pnpm dev
```

`pnpm dev` reads Fours data from the deployed Contrail API at `https://api.atmo.games`. To run the complete local stack instead:

```bash
pnpm dev:stack
```

This starts Contrail at `http://127.0.0.1:8787` and points the web app at it. Local Contrail state is stored under the ignored `.contrail/` directory.

## AT Protocol OAuth

OAuth is provided by [`@svelte-atproto/oauth`](https://www.npmjs.com/package/@svelte-atproto/oauth). Generate local secrets with:

```bash
pnpm atproto:setup
```

The production Worker needs `COOKIE_SECRET` and `CLIENT_ASSERTION_KEY` as private values:

```bash
pnpm exec atproto-oauth secret | pnpm exec wrangler secret put COOKIE_SECRET
pnpm exec atproto-oauth keygen | pnpm exec wrangler secret put CLIENT_ASSERTION_KEY
```

`ORIGIN` is configured as `https://atmo.games` in [`wrangler.jsonc`](wrangler.jsonc). OAuth sessions and states use the `OAUTH_SESSIONS` and `OAUTH_STATES` KV bindings.

The requested scope permits writes to the three Fours collections and the method-bound `games.atmo.notifyOfUpdate` call at `did:web:api.atmo.games#contrail`.

## Contrail API

The public Contrail Worker lives under [`api/`](api/README.md) and is configured for `https://api.atmo.games`. Useful commands:

```bash
pnpm api:dev                 # local API only
pnpm api:check               # generated Lexicon drift + TypeScript
pnpm contrail:generate       # refresh the app client from the local API source
pnpm api:deploy              # deploy the API Worker
pnpm contrail:update:prod    # validate deployed API and refresh provider lock/client
```

After the first deployment, backfill public Fours records with:

```bash
pnpm --dir api backfill:remote
```

## Web app deployment

```bash
pnpm check
pnpm build
pnpm deploy
```

The custom domain is configured as `atmo.games` in [`wrangler.jsonc`](wrangler.jsonc).
