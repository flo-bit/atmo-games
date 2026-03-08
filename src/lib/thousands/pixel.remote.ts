import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';

export const getPixelInfo = command(
	v.object({
		x: v.number(),
		y: v.number()
	}),
	async (input) => {
		const { platform } = getRequestEvent();
		const db = platform?.env?.PLACE_DB;
		if (!db) return null;

		const row = await db
			.prepare('SELECT did, painted_at FROM pixels WHERE x = ? AND y = ?')
			.bind(input.x, input.y)
			.first<{ did: string; painted_at: number }>();

		return row ? { did: row.did, painted_at: row.painted_at } : null;
	}
);
