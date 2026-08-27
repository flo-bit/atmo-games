import '$lib/../lexicon-types/index.js';
import { Client, ok, simpleFetchHandler } from '@atcute/client';
import { isActorIdentifier, isResourceUri } from '@atcute/lexicons/syntax';
import type { ActorIdentifier, ResourceUri } from '@atcute/lexicons';

const handler = simpleFetchHandler({ service: 'https://contrail.atmo.games' });
export const rpc = new Client({ handler });
export { ok };

export function toActor(value: string): ActorIdentifier {
	if (!isActorIdentifier(value)) throw new Error(`Invalid actor identifier: ${value}`);
	return value;
}

export function toUri(value: string): ResourceUri {
	if (!isResourceUri(value)) throw new Error(`Invalid AT URI: ${value}`);
	return value;
}

export async function notifyOfUpdate(uri: string): Promise<void> {
	try {
		await fetch('https://contrail.atmo.games/xrpc/games.atmo.notifyOfUpdate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ uri })
		});
	} catch {
		// Non-critical — Contrail will pick it up on next poll
	}
}

export function avatarUrl(did: string, blob: { ref: { $link: string } }): string {
	return `https://cdn.bsky.app/img/avatar/plain/${did}/${blob.ref.$link}@jpeg`;
}
