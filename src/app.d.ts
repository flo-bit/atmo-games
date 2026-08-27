// See https://svelte.dev/docs/kit/types#app.d.ts
import type { OAuthSession } from '@atcute/oauth-node-client';
import type { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import type {} from '@atcute/atproto';

declare global {
	namespace App {
		interface Locals {
			session: OAuthSession | null;
			client: Client | null;
			did: Did | null;
		}

		interface Platform {
			env: {
				OAUTH_SESSIONS: KVNamespace;
				OAUTH_STATES: KVNamespace;
				CLIENT_ASSERTION_KEY: string;
				COOKIE_SECRET: string;
				ORIGIN: string;
			};
		}
	}
}

export {};
