<script lang="ts">
	import { dev } from '$app/environment';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { ConnectionsGame, DIFFICULTY_COLORS, GAP } from './game.svelte';
	import type { ConnectionsPuzzle } from './types';

	let { puzzle, puzzleId }: { puzzle: ConnectionsPuzzle; puzzleId: number } = $props();

	const game = new ConnectionsGame(puzzle, puzzleId);

	let boardEl: HTMLDivElement | undefined = $state();
	let boardWidth: number = $state(0);
	let tileSize = $derived(boardWidth > 0 ? (boardWidth - 3 * GAP) / 4 : 0);

	$effect(() => {
		if (boardEl) {
			const measure = () => {
				boardWidth = boardEl!.offsetWidth;
			};
			measure();
			const ro = new ResizeObserver(measure);
			ro.observe(boardEl);
			return () => ro.disconnect();
		}
	});
</script>

<div class="relative flex w-full flex-col gap-4 px-2 py-4 sm:px-4">
	<p class="text-center text-sm font-semibold text-stone-700 dark:text-stone-300">
		Create four groups of four!
	</p>

	<div bind:this={boardEl} class="relative w-full" style:height="{tileSize * 4 + GAP * 3}px">
		{#each game.solvedGroups as group, i (group.category)}
			<div
				class="row-pop {DIFFICULTY_COLORS[group.difficulty]} absolute flex flex-col items-center justify-center overflow-hidden rounded-lg text-center"
				style:top="{i * (tileSize + GAP)}px"
				style:left="0"
				style:width="{boardWidth}px"
				style:height="{tileSize}px"
			>
				<span class="text-base font-extrabold sm:text-2xl">{group.category}</span>
				<span class="text-sm leading-tight font-semibold sm:text-lg">{group.words.join(', ')}</span>
			</div>
		{/each}

		{#each game.remainingWords as word, idx (word)}
			{@const row = game.solvedGroups.length + Math.floor(idx / 4)}
			{@const col = idx % 4}
			<button
				animate:flip={{ duration: 400 }}
				class="absolute flex cursor-pointer items-center justify-center overflow-hidden rounded-lg px-1 text-center text-sm leading-tight font-extrabold break-all hyphens-auto uppercase sm:text-lg {game.tileClasses(word)} {game.shakingWords.includes(word) ? 'shake' : ''} {game.bouncingWords.includes(word) ? 'bounce' : ''}"
				style="{game.tileStyle(word)} top: {row * (tileSize + GAP)}px; left: {col *
					(tileSize + GAP)}px; width: {tileSize}px; height: {tileSize}px;"
				onclick={() => game.toggleWord(word)}
				disabled={game.gameState !== 'playing' || game.isSubmitting}
				lang="en"
			>
				<span class="max-w-full">{word.toLowerCase()}</span>
			</button>
		{/each}
	</div>

	{#if game.feedback}
		<div
			class="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex justify-center"
			transition:fade={{ duration: 300 }}
		>
			<span
				class="rounded-full bg-stone-800 px-3 py-1 text-sm font-semibold text-white shadow-lg dark:bg-stone-200 dark:text-stone-900"
			>
				{game.feedback}
			</span>
		</div>
	{/if}

	<div class="flex items-center justify-center gap-1 text-xs text-stone-600 dark:text-stone-400">
		<span>Mistakes remaining:</span>
		<div class="flex gap-0.5">
			{#each Array(4) as _, i (i)}
				<span
					class="inline-block size-2.5 rounded-full {i < 4 - game.mistakes
						? 'bg-stone-700 dark:bg-stone-300'
						: 'bg-stone-300 dark:bg-stone-600'}"
				></span>
			{/each}
		</div>
	</div>

	<div class="flex items-center justify-center gap-2">
		{#if game.gameState === 'playing'}
			<button
				class="cursor-pointer rounded-full border border-stone-400 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={() => game.shuffleRemaining()}
				disabled={game.isSubmitting}
			>
				Shuffle
			</button>
			<button
				class="cursor-pointer rounded-full border border-stone-400 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={() => game.deselectAll()}
				disabled={game.selectedWords.length === 0 || game.isSubmitting}
			>
				Deselect All
			</button>
			<button
				class="cursor-pointer rounded-full border border-stone-400 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={() => game.submitGuess()}
				disabled={game.selectedWords.length !== 4 || game.isSubmitting}
			>
				Submit
			</button>
			<button
				class="cursor-pointer rounded-full border border-stone-400 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={() => game.showHint()}
				disabled={game.isSubmitting}
			>
				Hint
			</button>
		{:else}
			<span class="text-xs text-stone-500 dark:text-stone-400">
				Next puzzle in {game.countdown}
			</span>
		{/if}
		{#if dev}
			<button
				class="cursor-pointer rounded-full border border-red-400 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/30"
				onclick={() => game.reset()}
			>
				Reset
			</button>
		{/if}
	</div>
</div>

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(-4px);
		}
		40% {
			transform: translateX(4px);
		}
		60% {
			transform: translateX(-4px);
		}
		80% {
			transform: translateX(2px);
		}
	}
	.shake {
		animation: shake 0.5s ease-in-out;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-12px);
		}
		60% {
			transform: translateY(-4px);
		}
	}
	.bounce {
		animation: bounce 0.4s ease-in-out both;
	}

	@keyframes row-pop {
		0% {
			opacity: 0;
			transform: scale(0.95);
		}
		60% {
			opacity: 1;
			transform: scale(1.02);
		}
		100% {
			transform: scale(1);
		}
	}
	.row-pop {
		animation: row-pop 0.4s ease-out both;
	}
</style>
