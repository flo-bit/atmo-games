<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicIn } from 'svelte/easing';
	import { Avatar, Button } from '@foxui/core';
	import FoursGame from '$lib/fours/FoursGame.svelte';
	import type { FoursPuzzle, FoursScore } from '$lib/fours/types';
	import { getScoreLocal } from '$lib/fours/scores/idb';
	import { saveScore } from '$lib/fours/scores/save';

	let showOverlay = $state(true);

	let handle = $derived(page.data.handle as string);
	let avatar = $derived(page.data.avatar as string | undefined);
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
				if (entry) localScore = { guesses: entry.record.guesses.map((g) => g.words), won: entry.record.state === 'won' };
			} catch { /* ignored */ }
		}
	});

	function handleGameEnd(score: FoursScore) {
		saveScore(puzzleUri, score);
	}
</script>

{#if showOverlay}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-base-50 dark:bg-base-950"
		out:fly={{ y: -window.innerHeight, duration: 150, opacity: 1, easing: cubicIn }}
	>
		<div class="flex flex-col items-center gap-16">
			<h1 class="text-4xl font-bold text-base-800 dark:text-base-200">Fours</h1>
			<div class="flex w-48 flex-col gap-3">
				<Button size="lg" class="w-full" onclick={() => (showOverlay = false)}>Play daily</Button>
				<Button size="lg" variant="secondary" class="w-full" href="/fours/create">Create puzzle</Button>
			</div>
		</div>
	</div>
{/if}

<div class="flex min-h-svh flex-col items-center justify-center p-4">
	<div class="mb-4 flex flex-col items-center">
		<h1 class="text-2xl font-bold text-base-800 dark:text-base-200">Fours</h1>
		<span class="mt-1 text-xs text-base-400 dark:text-base-500">
			{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
		</span>
		<span class="mt-1 flex items-center gap-1 text-xs text-base-400 dark:text-base-500">
			by <Avatar src={avatar} alt={handle} class="size-4" /> {handle}
		</span>
	</div>

	<div class="w-full max-w-lg">
		{#key existingScore}
			<FoursGame {puzzle} score={existingScore} {shuffledWords} onGameEnd={handleGameEnd} />
		{/key}
	</div>
</div>
