import type { PageServerLoad } from './$types';
import { rpc, ok, avatarUrl, toUri } from '$lib/fours/contrail';
import type { FoursPuzzle } from '$lib/fours/types';
import { shuffleWords } from '$lib/fours/daily';
import { loadScore } from '$lib/fours/scores/load';
import { resolveActor, DEFAULT_HANDLE } from '$lib/fours/resolve';
import { error } from '@sveltejs/kit';

const EPOCH = new Date('2026-01-01T00:00:00Z').getTime();

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const actor = params.actor || DEFAULT_HANDLE;
	const isMainDaily = !params.actor;
	const requestedRkey = url.searchParams.get('p');

	const { did, handle, avatar } = await resolveActor(actor);

	// Get puzzle list
	let listData;
	try {
		listData = await ok(
			rpc.get('games.atmo.puzzleList.getRecord', {
				params: { uri: toUri(`at://${did}/games.atmo.fours.puzzleList/self`) }
			})
		);
	} catch {
		error(404, 'No puzzle list found');
	}

	const puzzles = listData.value?.puzzles;
	if (!puzzles?.length) {
		error(404, 'Puzzle list is empty');
	}

	// Calculate today's puzzle
	const puzzleCount = puzzles.length;
	const daysSinceEpoch = Math.floor((Date.now() - EPOCH) / (1000 * 60 * 60 * 24));
	const todayIndex = ((daysSinceEpoch % puzzleCount) + puzzleCount) % puzzleCount;
	const todayUri = puzzles[todayIndex];

	// Determine which puzzle to load
	let puzzleUri: string;
	if (requestedRkey) {
		const match = puzzles.find((uri) => uri.endsWith(`/${requestedRkey}`));
		puzzleUri = match ?? `at://${did}/games.atmo.fours.puzzle/${requestedRkey}`;
	} else {
		puzzleUri = todayUri;
	}

	const isToday = puzzleUri === todayUri;

	// Fetch puzzle via Contrail
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

	// Puzzle author from profiles or resolve
	let puzzleAuthor: { handle: string; avatar?: string };
	const authorProfile = puzzleData.profiles?.find((p) => p.did === puzzleData.did);
	if (authorProfile) {
		let authorAvatar: string | undefined;
		if (authorProfile.value?.avatar) {
			authorAvatar = avatarUrl(puzzleData.did, authorProfile.value.avatar);
		}
		puzzleAuthor = { handle: authorProfile.handle ?? puzzleData.did, avatar: authorAvatar };
	} else if (puzzleData.did === did) {
		puzzleAuthor = { handle, avatar };
	} else {
		puzzleAuthor = await resolveActor(puzzleData.did);
	}

	const puzzle = puzzleData.value as unknown as FoursPuzzle;
	const score = locals.did ? await loadScore(puzzleUri, locals.did) : null;

	const todayRkey = todayUri.split('/').pop()!;

	return {
		isMainDaily,
		isToday,
		todayRkey: isToday ? null : todayRkey,
		handle: puzzleAuthor.handle,
		avatar: puzzleAuthor.avatar,
		date: isToday ? new Date().toISOString() : puzzleData.value.createdAt,
		puzzleUri,
		puzzle,
		shuffledWords: shuffleWords(puzzle),
		score
	};
};
