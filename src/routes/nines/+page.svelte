<script lang="ts">
	import { Button } from '@foxui/core';
	import NinesGame from '$lib/nines/NinesGame.svelte';
	import { generatePuzzle } from '$lib/nines/generator';
	import type { Difficulty } from '$lib/nines/types';

	let difficulty: Difficulty = $state('medium');
	let puzzle = $state(generatePuzzle('medium'));
	let gameKey = $state(0);

	function newGame(diff?: Difficulty) {
		if (diff) difficulty = diff;
		puzzle = generatePuzzle(difficulty);
		gameKey++;
	}
</script>

<div class="flex min-h-svh flex-col items-center px-4 py-8">
	<div class="mb-4 flex flex-col items-center gap-2">
		<a
			href="/"
			class="text-base-400 hover:text-base-600 dark:text-base-500 dark:hover:text-base-300 text-sm"
			>&larr; atmo games</a
		>
		<h1 class="text-base-800 dark:text-base-200 text-2xl font-bold">Nines</h1>
		<p class="text-base-500 dark:text-base-400 text-sm">
			Fill every row, column, and box with 1-9.
		</p>
	</div>

	<div class="mb-4 flex flex-wrap justify-center gap-2">
		{#each ['easy', 'medium', 'hard', 'expert'] as diff (diff)}
			<button
				class="cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors
					{difficulty === diff
					? 'bg-orange-500 text-white'
					: 'bg-base-200 text-base-600 hover:bg-base-300 dark:bg-base-800 dark:text-base-400 dark:hover:bg-base-700'}"
				onclick={() => newGame(diff as Difficulty)}
			>
				{diff}
			</button>
		{/each}
	</div>

	<div class="w-full max-w-lg">
		{#key gameKey}
			<NinesGame
				{puzzle}
				onGameEnd={(won, time) => {
					if (won) console.log(`Solved in ${time}s`);
				}}
			/>
		{/key}
	</div>

	<div class="mt-4">
		<Button variant="secondary" onclick={() => newGame()}>New Puzzle</Button>
	</div>
</div>
