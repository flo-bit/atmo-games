<script lang="ts">
	import { NinesGame } from './game.svelte';
	import type { NinesPuzzle } from './types';

	const {
		puzzle,
		onGameEnd
	}: {
		puzzle: NinesPuzzle;
		onGameEnd?: (won: boolean, time: number) => void;
	} = $props();

	const game = $derived(new NinesGame(puzzle));

	let hasNotifiedEnd = $state(false);

	$effect(() => {
		if (game.gameState !== 'playing' && !hasNotifiedEnd) {
			hasNotifiedEnd = true;
			onGameEnd?.(game.gameState === 'won', game.elapsed);
		}
	});

	$effect(() => {
		return () => game.destroy();
	});

	function handleKeydown(e: KeyboardEvent) {
		if (game.gameState !== 'playing') return;

		if (e.key >= '1' && e.key <= '9') {
			game.enterNumber(parseInt(e.key));
		} else if (e.key === 'Backspace' || e.key === 'Delete') {
			game.erase();
		} else if (e.key === 'ArrowUp' && game.selectedCell) {
			e.preventDefault();
			game.selectCell(Math.max(0, game.selectedCell.row - 1), game.selectedCell.col);
		} else if (e.key === 'ArrowDown' && game.selectedCell) {
			e.preventDefault();
			game.selectCell(Math.min(8, game.selectedCell.row + 1), game.selectedCell.col);
		} else if (e.key === 'ArrowLeft' && game.selectedCell) {
			e.preventDefault();
			game.selectCell(game.selectedCell.row, Math.max(0, game.selectedCell.col - 1));
		} else if (e.key === 'ArrowRight' && game.selectedCell) {
			e.preventDefault();
			game.selectCell(game.selectedCell.row, Math.min(8, game.selectedCell.col + 1));
		} else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			game.undo();
		} else if (e.key === 'n' || e.key === 'N') {
			game.toggleNoteMode();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex w-full flex-col items-center gap-4 px-2 py-4 sm:px-4">
	<div class="flex w-full max-w-md items-center justify-between px-1">
		<div class="flex items-center gap-3">
			<span
				class="bg-base-200 text-base-600 dark:bg-base-800 dark:text-base-400 rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase"
			>
				{puzzle.difficulty}
			</span>
		</div>
		<div class="flex items-center gap-3">
			<div class="flex items-center gap-1 text-sm">
				{#each Array(3) as _, i (i)}
					<span class="{i < 3 - game.mistakes ? 'opacity-100' : 'opacity-25'} text-red-500"
						>&hearts;</span
					>
				{/each}
			</div>
			<span class="text-base-600 dark:text-base-400 font-mono text-sm tabular-nums"
				>{game.formattedTime}</span
			>
		</div>
	</div>

	<!-- Sudoku Grid -->
	<div class="sudoku-grid aspect-square w-full max-w-md" role="grid">
		{#each Array(9) as _, row (row)}
			{#each Array(9) as _, col (col)}
				{@const value = game.grid[row][col]}
				{@const cellNotes = game.notes[row][col]}
				{@const isInitial = game.isInitialCell(row, col)}
				<button
					class="sudoku-cell border-base-300 dark:border-base-600 flex items-center justify-center
						{game.cellClasses(row, col)}
						{isInitial ? 'font-extrabold' : 'font-semibold'}
						{col % 3 === 0 && col !== 0 ? 'border-l-base-500 dark:border-l-base-400 border-l-2' : 'border-l'}
						{row % 3 === 0 && row !== 0 ? 'border-t-base-500 dark:border-t-base-400 border-t-2' : 'border-t'}
						{col === 8 ? '' : ''}
						{row === 8 ? '' : ''}"
					style="grid-row: {row + 1}; grid-column: {col + 1};"
					onclick={() => game.selectCell(row, col)}
					aria-label="Row {row + 1}, Column {col + 1}{value ? `, value ${value}` : ', empty'}"
				>
					{#if value !== 0}
						<span class="text-lg sm:text-2xl">{value}</span>
					{:else if cellNotes.size > 0}
						<div class="notes-grid">
							{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as n (n)}
								<span
									class="text-[8px] leading-none sm:text-[10px] {cellNotes.has(n)
										? 'text-base-500 dark:text-base-400'
										: 'text-transparent'}">{n}</span
								>
							{/each}
						</div>
					{/if}
				</button>
			{/each}
		{/each}
	</div>

	{#if game.gameState === 'playing'}
		<!-- Number pad -->
		<div class="grid w-full max-w-md grid-cols-9 gap-1">
			{#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as num (num)}
				<button
					class="bg-base-200 text-base-800 hover:bg-base-300 active:bg-base-400 dark:bg-base-800 dark:text-base-200 dark:hover:bg-base-700 dark:active:bg-base-600 flex aspect-square cursor-pointer items-center justify-center rounded-lg text-lg font-bold transition-colors sm:text-xl"
					onclick={() => game.enterNumber(num)}
				>
					{num}
				</button>
			{/each}
		</div>

		<!-- Controls -->
		<div class="flex flex-wrap items-center justify-center gap-2">
			<button
				class="border-base-400 text-base-700 hover:bg-base-200 dark:border-base-500 dark:text-base-300 dark:hover:bg-base-700 cursor-pointer rounded-full border px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
				onclick={() => game.undo()}
				disabled={game.gameState !== 'playing'}
			>
				Undo
			</button>
			<button
				class="cursor-pointer rounded-full border px-5 py-2 text-sm font-semibold transition-colors
					{game.noteMode
					? 'border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-400 dark:bg-blue-900 dark:text-blue-300'
					: 'border-base-400 text-base-700 hover:bg-base-200 dark:border-base-500 dark:text-base-300 dark:hover:bg-base-700'}"
				onclick={() => game.toggleNoteMode()}
			>
				Notes {game.noteMode ? 'ON' : 'OFF'}
			</button>
			<button
				class="border-base-400 text-base-700 hover:bg-base-200 dark:border-base-500 dark:text-base-300 dark:hover:bg-base-700 cursor-pointer rounded-full border px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
				onclick={() => game.erase()}
			>
				Erase
			</button>
		</div>
	{:else if game.gameState === 'won'}
		<div class="flex flex-col items-center gap-2 py-4">
			<span class="text-2xl font-bold text-green-600 dark:text-green-400">Puzzle Complete!</span>
			<span class="text-base-500 dark:text-base-400 text-sm">
				Solved in {game.formattedTime} with {game.mistakes} mistake{game.mistakes !== 1 ? 's' : ''}
			</span>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-2 py-4">
			<span class="text-2xl font-bold text-red-600 dark:text-red-400">Game Over</span>
			<span class="text-base-500 dark:text-base-400 text-sm">Too many mistakes</span>
		</div>
	{/if}
</div>

<style>
	.sudoku-grid {
		display: grid;
		grid-template-columns: repeat(9, 1fr);
		grid-template-rows: repeat(9, 1fr);
		border: 2px solid var(--color-base-500);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	:global(.dark) .sudoku-grid {
		border-color: var(--color-base-400);
	}

	.sudoku-cell {
		cursor: pointer;
		aspect-ratio: 1;
		transition: background-color 0.1s;
	}

	.notes-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		width: 100%;
		height: 100%;
		place-items: center;
	}
</style>
