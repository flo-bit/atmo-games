import '@atcute/atproto';
import { createAtprotoAuth } from '@svelte-atproto/oauth/server';
import { cloudflareKV } from '@svelte-atproto/oauth/server/stores/cloudflare';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { contrail } from '$lib/contrail-client.server';
import { DEV_PORT } from './port';

export const atproto = createAtprotoAuth({
	origin: env.ORIGIN,
	cookieSecret: env.COOKIE_SECRET || (building ? 'build-only-cookie-secret' : undefined),
	clientAssertionKey: env.CLIENT_ASSERTION_KEY,
	devPort: DEV_PORT,
	signupPDS: 'https://bsky.social/',
	scope: [
		'atproto repo:games.atmo.fours.puzzle repo:games.atmo.fours.score repo:games.atmo.fours.puzzleList',
		contrail.scope
	]
		.filter(Boolean)
		.join(' '),
	sessions: cloudflareKV('OAUTH_SESSIONS'),
	states: cloudflareKV('OAUTH_STATES', { ttl: 600 })
});
