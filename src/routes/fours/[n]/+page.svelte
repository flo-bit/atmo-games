<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ConnectionsGame from '$lib/connections/ConnectionsGame.svelte';
	import { fetchPuzzle, TOTAL_PUZZLES } from '$lib/connections/daily';
	import type { ConnectionsPuzzle } from '$lib/connections/types';

	let puzzle: ConnectionsPuzzle | null = $state(null);
	let error: string | null = $state(null);

	let puzzleNumber = $derived(Number(page.params.n));

	$effect(() => {
		const n = puzzleNumber;
		puzzle = null;
		error = null;

		if (isNaN(n) || n < 1 || n > TOTAL_PUZZLES) {
			error = `Puzzle ${page.params.n} not found`;
			return;
		}

		fetchPuzzle(n).then((p) => {
			puzzle = p;
		});
	});
</script>

<svelte:body
	onkeydown={(evt) => {
		if (evt.key === 'n') {
			goto('/fours/' + (puzzleNumber + 1));
		}
	}}
/>

<div class="flex min-h-svh flex-col items-center justify-center p-4">
	<h1 class="mb-4 text-2xl font-bold text-stone-800 dark:text-stone-200">Fours #{puzzleNumber}</h1>

	{#if error}
		<p class="text-sm text-red-500">{error}</p>
	{:else if puzzle}
		<div class="w-full max-w-lg">
			<ConnectionsGame {puzzle} puzzleId={puzzleNumber} />
		</div>
	{:else}
		<p class="text-sm text-stone-500">Loading...</p>
	{/if}
</div>
