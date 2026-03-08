import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';

/** Get the cooldown timestamp for a single DID — 1 KV read. */
export const getCooldownInfo = command(
	v.object({ did: v.string() }),
	async (input) => {
		const { platform } = getRequestEvent();
		const kv = platform?.env?.PLACE_KV;
		if (!kv) return { last_paint_at: 0 };

		const val = await kv.get(`cooldown:${input.did}`, 'text');
		return { last_paint_at: val ? parseInt(val, 10) : 0 };
	}
);

/** Get the full block and whitelist arrays — 2 KV reads. */
export const getLists = command(
	v.object({}),
	async () => {
		const { platform } = getRequestEvent();
		const kv = platform?.env?.PLACE_KV;
		if (!kv) return { blocked: [] as string[], whitelisted: [] as string[] };

		const [blockJson, whitelistJson] = await Promise.all([
			kv.get('block', 'text'),
			kv.get('whitelist', 'text')
		]);

		return {
			blocked: blockJson ? (JSON.parse(blockJson) as string[]) : [],
			whitelisted: whitelistJson ? (JSON.parse(whitelistJson) as string[]) : []
		};
	}
);
