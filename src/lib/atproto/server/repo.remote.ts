import { error } from '@sveltejs/kit';
import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { permissions } from '../settings';

const collectionSchema = v.pipe(
	v.string(),
	v.regex(/^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z][a-zA-Z0-9-]*){2,}$/),
	v.check(
		(c) => permissions.collections.some((allowed) => c === allowed || allowed.startsWith(c + '?')),
		'Collection not in allowed list'
	)
);

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

		try {
			const response = await locals.client.post('com.atproto.repo.putRecord', {
				input: {
					collection: input.collection as `${string}.${string}.${string}`,
					repo: locals.did,
					rkey: input.rkey || 'self',
					record: input.record
				}
			});
			return { ok: true as const, data: response.data, rateLimit: parseRateLimit(response.headers) };
		} catch (e: unknown) {
			const err = e as { status?: number; headers?: Headers };
			if (err?.status === 429) {
				const reset = parseInt(err.headers?.get('ratelimit-reset') ?? '0', 10);
				return { ok: false as const, rateLimited: true as const, resetAt: reset };
			}
			throw e;
		}
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

		const response = await locals.client.post('com.atproto.repo.deleteRecord', {
			input: {
				collection: input.collection as `${string}.${string}.${string}`,
				repo: locals.did,
				rkey: input.rkey || 'self'
			}
		});

		return { ok: response.ok };
	}
);

export const uploadBlob = command(
	v.object({
		blob: v.instance(Blob)
	}),
	async (input) => {
		const { locals } = getRequestEvent();
		if (!locals.client || !locals.did) error(401, 'Not authenticated');

		const response = await locals.client.post('com.atproto.repo.uploadBlob', {
			params: { repo: locals.did },
			input: input.blob
		});

		if (!response.ok) error(500, 'Upload failed');

		return response.data.blob as {
			$type: 'blob';
			ref: { $link: string };
			mimeType: string;
			size: number;
		};
	}
);
