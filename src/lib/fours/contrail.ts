import { ok } from '@atcute/client';
import { isActorIdentifier, isResourceUri } from '@atcute/lexicons/syntax';
import type { ActorIdentifier, ResourceUri } from '@atcute/lexicons';
import { contrail as rpc } from '$lib/contrail-client.server';

export { ok, rpc };

export function toActor(value: string): ActorIdentifier {
	if (!isActorIdentifier(value)) throw new Error(`Invalid actor identifier: ${value}`);
	return value;
}

export function toUri(value: string): ResourceUri {
	if (!isResourceUri(value)) throw new Error(`Invalid AT URI: ${value}`);
	return value;
}

export function avatarUrl(did: string, blob: { ref: { $link: string } }): string {
	return `https://cdn.bsky.app/img/avatar/plain/${did}/${blob.ref.$link}@jpeg`;
}
