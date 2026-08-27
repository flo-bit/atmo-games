export { user, login, signup, logout } from './auth.svelte';
export { createTID, getRecord } from '@svelte-atproto/oauth/helper';

export async function putRecord(input: {
	collection: 'games.atmo.fours.puzzle' | 'games.atmo.fours.score' | 'games.atmo.fours.puzzleList';
	rkey?: string;
	record: Record<string, unknown>;
}) {
	const { putRecord: putRecordRemote } = await import('./repo.remote');
	return putRecordRemote(input);
}
