import type { PageServerLoad } from './$types';
import { getDetailedProfile, getRecord, resolveHandle } from '$lib/atproto/methods';
import type { Did, Handle } from '@atcute/lexicons';
import type { FoursPuzzle, FoursScore } from '$lib/fours/types';
import type { FoursScoreRecord } from '$lib/fours/scores/types';
import { getScoreBacklink } from '$lib/fours/scores/backlinks';
import { shuffleWords } from '$lib/fours/daily';
import { error } from '@sveltejs/kit';

const DEFAULT_HANDLE = 'atmo.games';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const actor = params.actor || DEFAULT_HANDLE;

	let did: Did;
	if (actor.startsWith('did:')) {
		did = actor as Did;
	} else {
		did = await resolveHandle({ handle: actor as Handle, fetch });
	}

	const profile = await getDetailedProfile({ did });
	const rkey = params.rkey;

	const record = await getRecord({
		did,
		collection: 'games.atmo.fours.puzzle',
		rkey
	}).catch(() => null);

	if (!record) {
		error(404, 'Puzzle not found');
	}

	const puzzleUri = `at://${did}/games.atmo.fours.puzzle/${rkey}`;

	let score: FoursScore | null = null;
	if (locals.did) {
		try {
			const backlink = await getScoreBacklink(puzzleUri, locals.did);
			if (backlink) {
				const scoreRecord = await getRecord({
					did: locals.did,
					collection: 'games.atmo.fours.score',
					rkey: backlink.rkey
				}).catch(() => null);
				if (scoreRecord?.value) {
					const val = scoreRecord.value as FoursScoreRecord;
					score = { guesses: val.guesses.map((g) => g.words), won: val.state === 'won' };
				}
			}
		} catch {
			// Non-fatal — user just starts fresh
		}
	}

	return {
		authorDid: did,
		handle: profile?.handle ?? actor,
		avatar: profile?.avatar as string | undefined,
		rkey,
		puzzleUri,
		puzzle: record.value as FoursPuzzle,
		shuffledWords: shuffleWords(record.value as FoursPuzzle),
		score
	};
};
