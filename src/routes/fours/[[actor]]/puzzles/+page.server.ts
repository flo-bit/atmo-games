import type { PageServerLoad } from './$types';
import { rpc, ok, toActor } from '$lib/fours/contrail';
import type { FoursPuzzle } from '$lib/fours/types';
import { shuffleWords } from '$lib/fours/daily';
import { resolveActor, DEFAULT_HANDLE } from '$lib/fours/resolve';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const actor = params.actor || DEFAULT_HANDLE;
	const { did, handle, avatar } = await resolveActor(actor);

	const data = await ok(
		rpc.get('games.atmo.puzzle.listRecords', {
			params: { actor: toActor(did), limit: 200, order: 'asc' }
		})
	);

	if (!data.records.length) {
		error(404, 'No puzzles found for this user');
	}

	const puzzles = data.records.map((r) => {
		const puzzle = r.value as unknown as FoursPuzzle & { createdAt?: string };
		return {
			rkey: r.rkey,
			did: r.did,
			words: shuffleWords(puzzle),
			createdAt: puzzle.createdAt ?? null
		};
	});

	return { did, handle, avatar, puzzles };
};
