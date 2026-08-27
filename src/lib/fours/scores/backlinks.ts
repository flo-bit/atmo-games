import type { Did } from '@atcute/lexicons';
import { listBacklinks } from '@svelte-atproto/oauth/helper';

export async function getScoreBacklink(
	puzzleUri: string,
	userDid: string
): Promise<{ collection: string; rkey: string } | null> {
	const page = await listBacklinks(
		puzzleUri,
		{
			collection: 'games.atmo.fours.score',
			path: '.puzzle.uri'
		},
		{ did: userDid as Did, limit: 1 }
	);
	const record = page?.records[0];
	return record ? { collection: record.collection, rkey: record.rkey } : null;
}
