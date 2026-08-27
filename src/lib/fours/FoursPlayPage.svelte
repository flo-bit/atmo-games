<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import FoursGame from './FoursGame.svelte';
	import type { FoursPuzzle, FoursScore } from './types';
	import { getScoreLocal } from './scores/idb';
	import { saveScore } from './scores/save';

	let { header }: { header: Snippet } = $props();

	let puzzle = $derived(page.data.puzzle as FoursPuzzle);
	let shuffledWords = $derived(page.data.shuffledWords as string[]);
	let puzzleUri = $derived(page.data.puzzleUri as string);

	let serverScore = $derived(page.data.score as FoursScore | null);
	let localScore: FoursScore | undefined = $state(undefined);
	let existingScore = $derived(serverScore ?? localScore ?? undefined);

	onMount(async () => {
		if (!serverScore) {
			try {
				const entry = await getScoreLocal(puzzleUri);
				if (entry)
					localScore = {
						guesses: entry.record.guesses.map((g) => g.words),
						won: entry.record.state === 'games.atmo.fours.score#won'
					};
			} catch {
				/* ignored */
			}
		}
	});

	function handleGameEnd(score: FoursScore) {
		saveScore(puzzleUri, score);
	}
</script>

<div class="flex min-h-svh flex-col items-center justify-center p-4">
	<div class="mb-4 flex w-full max-w-lg flex-col items-start px-2">
		{@render header()}
	</div>

	<div class="w-full max-w-lg">
		{#key existingScore}
			<FoursGame {puzzle} score={existingScore} {shuffledWords} onGameEnd={handleGameEnd} />
		{/key}
	</div>
</div>
