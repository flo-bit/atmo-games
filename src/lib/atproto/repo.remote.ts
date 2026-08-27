import { error } from '@sveltejs/kit';
import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { contrail } from '$lib/contrail-client.server';

const collections = [
	'games.atmo.fours.puzzle',
	'games.atmo.fours.score',
	'games.atmo.fours.puzzleList'
] as const;

const collectionSchema = v.picklist(collections);
const rkeySchema = v.optional(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9._:~-]{1,512}$/)));

function parseRateLimit(headers: Headers) {
	const limit = parseInt(headers.get('ratelimit-limit') ?? '0', 10);
	const remaining = parseInt(headers.get('ratelimit-remaining') ?? '0', 10);
	const reset = parseInt(headers.get('ratelimit-reset') ?? '0', 10);
	if (!limit) return null;
	return { limit, remaining, reset };
}

export const putRecord = command(
	v.object({
		collection: collectionSchema,
		rkey: rkeySchema,
		record: v.record(v.string(), v.unknown())
	}),
	async (input) => {
		const { locals } = getRequestEvent();
		if (!locals.client || !locals.did) error(401, 'Not authenticated');

		const response = await contrail
			.authenticated(locals.client)
			.post('com.atproto.repo.putRecord', {
				input: {
					collection: input.collection,
					repo: locals.did,
					rkey: input.rkey || 'self',
					record: input.record
				}
			});
		if (response.status === 429) {
			const resetAt = parseInt(response.headers.get('ratelimit-reset') ?? '0', 10);
			return { ok: false as const, rateLimited: true as const, resetAt };
		}
		if (!response.ok) error(response.status, 'Could not save record');
		return { ok: true as const, data: response.data, rateLimit: parseRateLimit(response.headers) };
	}
);

export const deleteRecord = command(
	v.object({
		collection: collectionSchema,
		rkey: rkeySchema
	}),
	async (input) => {
		const { locals } = getRequestEvent();
		if (!locals.client || !locals.did) error(401, 'Not authenticated');

		const response = await contrail
			.authenticated(locals.client)
			.post('com.atproto.repo.deleteRecord', {
				input: {
					collection: input.collection,
					repo: locals.did,
					rkey: input.rkey || 'self'
				},
				as: null
			});
		if (!response.ok) error(response.status, 'Could not delete record');
		return { ok: true };
	}
);
