import type { PageServerLoad } from './$types';
import { rpc, ok, avatarUrl, toUri } from '$lib/fours/contrail';
import type { FoursPuzzle } from '$lib/fours/types';
import { shuffleWords } from '$lib/fours/daily';
import { loadScore } from '$lib/fours/scores/load';
import { resolveActor } from '$lib/fours/resolve';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { did } = await resolveActor(params.actor);
	const puzzleUri = `at://${did}/games.atmo.fours.puzzle/${params.rkey}`;

	let puzzleData;
	try {
		puzzleData = await ok(
			rpc.get('games.atmo.puzzle.getRecord', {
				params: { uri: toUri(puzzleUri), profiles: true }
			})
		);
	} catch {
		error(404, 'Puzzle not found');
	}

	if (!puzzleData.value) {
		error(404, 'Puzzle not found');
	}

	const authorProfile = puzzleData.profiles?.find((p) => p.did === puzzleData.did);
	const handle = authorProfile?.handle ?? did;
	let authorAvatar: string | undefined;
	if (authorProfile?.value?.avatar) {
		authorAvatar = avatarUrl(puzzleData.did, authorProfile.value.avatar);
	}

	const puzzle = puzzleData.value as unknown as FoursPuzzle;
	const score = locals.did ? await loadScore(puzzleUri, locals.did) : null;

	return {
		handle,
		avatar: authorAvatar,
		date: puzzleData.value.createdAt,
		puzzleUri,
		puzzle,
		shuffledWords: shuffleWords(puzzle),
		score
	};
};
