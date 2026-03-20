import type { PageServerLoad } from './$types';
import { getDetailedProfile, getRecord, resolveHandle, parseUri } from '$lib/atproto/methods';
import type { Did, Handle } from '@atcute/lexicons';
import type { FoursPuzzle } from '$lib/fours/types';
import { shuffleWords } from '$lib/fours/daily';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const actor = params.actor;

	let did: Did;
	if (actor.startsWith('did:')) {
		did = actor as Did;
	} else {
		did = await resolveHandle({ handle: actor as Handle, fetch });
	}

	const profile = await getDetailedProfile({ did });

	const listRecord = await getRecord({
		did,
		collection: 'games.atmo.fours.puzzleList',
		rkey: 'self'
	}).catch(() => null);

	if (!listRecord?.value) {
		error(404, 'No puzzles found for this user');
	}

	const puzzleUris = (listRecord.value as { puzzles: string[] }).puzzles;
	if (!puzzleUris.length) {
		error(404, 'No puzzles found for this user');
	}

	const puzzles = await Promise.all(
		puzzleUris.map(async (uri) => {
			const parsed = parseUri(uri);
			if (!parsed) return null;
			const record = await getRecord({
				did: parsed.repo as Did,
				collection: 'games.atmo.fours.puzzle',
				rkey: parsed.rkey
			}).catch(() => null);
			if (!record) return null;
			const puzzle = record.value as FoursPuzzle & { createdAt?: string };
			return {
				rkey: parsed.rkey,
				words: shuffleWords(puzzle),
				createdAt: puzzle.createdAt ?? null
			};
		})
	);

	return {
		did,
		handle: profile?.handle ?? actor,
		avatar: profile?.avatar as string | undefined,
		puzzles: puzzles.filter((p) => p != null)
	};
};
