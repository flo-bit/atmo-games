<script lang="ts">
	import { onMount } from 'svelte';
	import ConnectionsGame from '$lib/connections/ConnectionsGame.svelte';
	import { getTodayPuzzleNumber, fetchPuzzle } from '$lib/connections/daily';
	import type { ConnectionsPuzzle } from '$lib/connections/types';

	let puzzle: ConnectionsPuzzle | null = $state(null);
	let puzzleNumber = getTodayPuzzleNumber();

	onMount(async () => {
		puzzle = await fetchPuzzle(puzzleNumber);
	});
</script>

<div class="flex min-h-svh flex-col items-center justify-center p-4">
	<h1 class="mb-4 text-2xl font-bold text-stone-800 dark:text-stone-200">Fours</h1>

	{#if puzzle}
		<div class="w-full max-w-lg">
			<ConnectionsGame {puzzle} puzzleId={puzzleNumber} />
		</div>
	{:else}
		<p class="text-sm text-stone-500">Loading...</p>
	{/if}
</div>
