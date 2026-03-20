import type { PageServerLoad } from './$types';
import { getDetailedProfile, getRecord, resolveHandle, parseUri } from '$lib/atproto/methods';
import type { Did, Handle } from '@atcute/lexicons';
import type { FoursPuzzle, FoursScore } from '$lib/fours/types';
import type { FoursScoreRecord } from '$lib/fours/scores/types';
import { getScoreBacklink } from '$lib/fours/scores/backlinks';
import { shuffleWords } from '$lib/fours/daily';
import { error } from '@sveltejs/kit';

const DEFAULT_HANDLE = 'atmo.games';
const EPOCH = new Date('2026-01-01T00:00:00Z').getTime();

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const did = await resolveHandle({ handle: DEFAULT_HANDLE as Handle, fetch });
	const profile = await getDetailedProfile({ did });

	const listRecord = await getRecord({
		did,
		collection: 'games.atmo.fours.puzzleList',
		rkey: 'self'
	}).catch(() => null);

	if (!listRecord?.value) {
		error(404, 'No puzzle list found');
	}

	const puzzles = (listRecord.value as { puzzles: string[] }).puzzles;
	if (!puzzles.length) {
		error(404, 'Puzzle list is empty');
	}

	const puzzleCount = puzzles.length;
	const daysSinceEpoch = Math.floor((Date.now() - EPOCH) / (1000 * 60 * 60 * 24));
	const puzzleIndex = ((daysSinceEpoch % puzzleCount) + puzzleCount) % puzzleCount;

	const parsed = parseUri(puzzles[puzzleIndex]);
	if (!parsed) {
		error(500, 'Invalid puzzle URI');
	}

	const puzzleDid = parsed.repo as Did;
	const puzzleRkey = parsed.rkey;

	const record = await getRecord({
		did: puzzleDid,
		collection: 'games.atmo.fours.puzzle',
		rkey: puzzleRkey
	}).catch(() => null);

	if (!record) {
		error(404, 'Puzzle not found');
	}

	const puzzleUri = `at://${puzzleDid}/games.atmo.fours.puzzle/${puzzleRkey}`;

	// Resolve puzzle author profile if different from list owner
	let puzzleAuthor: { handle: string; avatar?: string };
	if (puzzleDid === did) {
		puzzleAuthor = { handle: profile?.handle ?? DEFAULT_HANDLE, avatar: profile?.avatar as string | undefined };
	} else {
		const authorProfile = await getDetailedProfile({ did: puzzleDid });
		puzzleAuthor = { handle: authorProfile?.handle ?? puzzleDid, avatar: authorProfile?.avatar as string | undefined };
	}

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
		handle: puzzleAuthor.handle,
		avatar: puzzleAuthor.avatar,
		puzzleUri,
		puzzle: record.value as FoursPuzzle,
		shuffledWords: shuffleWords(record.value as FoursPuzzle),
		score
	};
};
