import { rpc, ok, toActor } from '../contrail';
import type { FoursScore } from '../types';

export async function loadScore(puzzleUri: string, userDid: string): Promise<FoursScore | null> {
	try {
		const data = await ok(rpc.get('games.atmo.fours.score.listRecords', {
			params: { actor: toActor(userDid), puzzleUri, limit: 1 }
		}));

		const record = data.records[0]?.record;
		if (!record) return null;

		return {
			guesses: record.guesses.map((g) => g.words as [string, string, string, string]),
			won: record.state === 'games.atmo.fours.score#won'
		};
	} catch {
		return null;
	}
}
