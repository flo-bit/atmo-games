<script lang="ts">
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import type { ContentComponentProps } from '../../types';
	import { PUZZLES } from './puzzles';
	import { getTodayPuzzleIndex, getTodayDateString, getMillisUntilMidnight } from './daily';
	import type { ConnectionsGroup } from './types';

	let { item }: ContentComponentProps = $props();

	let shuffledWords: string[] = $state([]);
	let selectedWords: string[] = $state([]);
	let solvedGroups: ConnectionsGroup[] = $state([]);
	let mistakes: number = $state(0);
	let gameState: 'playing' | 'won' | 'lost' = $state('playing');
	let feedback: string | null = $state(null);
	let shakingWords: string[] = $state([]);
	let bouncingWords: string[] = $state([]);
	let coloringWords: string[] = $state([]);
	let coloringGroup: ConnectionsGroup | null = $state(null);
	let isSubmitting: boolean = $state(false);
	let countdown: string = $state('');

	let puzzle = $derived(PUZZLES[getTodayPuzzleIndex()]);

	let remainingWords = $derived(
		shuffledWords.filter(
			(word) => !solvedGroups.some((group) => group.words.includes(word as never))
		)
	);

	function shuffle<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function initGame() {
		const allWords = puzzle.groups.flatMap((g) => g.words);
		shuffledWords = shuffle(allWords);
		selectedWords = [];
		solvedGroups = [];
		mistakes = 0;
		gameState = 'playing';
		feedback = null;
		shakingWords = [];
		bouncingWords = [];
		coloringWords = [];
		coloringGroup = null;
		isSubmitting = false;
	}

	function toggleWord(word: string) {
		if (gameState !== 'playing' || isSubmitting) return;
		if (solvedGroups.some((g) => g.words.includes(word as never))) return;

		if (selectedWords.includes(word)) {
			selectedWords = selectedWords.filter((w) => w !== word);
		} else if (selectedWords.length < 4) {
			selectedWords = [...selectedWords, word];
		}
		feedback = null;
	}

	function submitGuess() {
		if (selectedWords.length !== 4 || gameState !== 'playing' || isSubmitting) return;

		const matchedGroup = puzzle.groups.find(
			(group) =>
				!solvedGroups.includes(group) &&
				selectedWords.every((w) => group.words.includes(w as never))
		);

		if (matchedGroup) {
			isSubmitting = true;
			const matched = [...selectedWords];

			// Step 1: staggered bounce on each selected tile
			bouncingWords = [...matched];

			setTimeout(() => {
				bouncingWords = [];

				// Step 2: reorder so matched words slide to first row of remaining
				const solvedWordSet = new Set(solvedGroups.flatMap((g) => g.words) as string[]);
				const matchedSet = new Set(matched);
				const solvedPart = shuffledWords.filter((w) => solvedWordSet.has(w));
				const others = shuffledWords.filter((w) => !solvedWordSet.has(w) && !matchedSet.has(w));
				shuffledWords = [...solvedPart, ...matched, ...others];

				setTimeout(() => {
					// Step 3: color flash the matched tiles (now in first row)
					coloringWords = [...matched];
					coloringGroup = matchedGroup;

					setTimeout(() => {
						// Step 4: tiles become solved row
						coloringWords = [];
						coloringGroup = null;
						selectedWords = [];
						solvedGroups = [...solvedGroups, matchedGroup];
						isSubmitting = false;

						if (solvedGroups.length === 4) {
							gameState = 'won';
							saveCompletion();
						}
					}, 400);
				}, 500);
			}, 700);
		} else {
			const almostGroup = puzzle.groups.find(
				(group) =>
					!solvedGroups.includes(group) &&
					selectedWords.filter((w) => group.words.includes(w as never)).length === 3
			);

			if (almostGroup) {
				feedback = 'One away!';
				setTimeout(() => {
					if (feedback === 'One away!') feedback = null;
				}, 2000);
			}

			shakingWords = [...selectedWords];
			mistakes += 1;
			selectedWords = [];

			if (mistakes >= 4) {
				isSubmitting = true;

				// Let shake finish, then reveal unsolved groups one by one
				setTimeout(() => {
					shakingWords = [];
					const unsolved = puzzle.groups
						.filter((g) => !solvedGroups.includes(g))
						.sort((a, b) => a.difficulty - b.difficulty);

					unsolved.forEach((group, i) => {
						setTimeout(() => {
							solvedGroups = [...solvedGroups, group];
							if (i === unsolved.length - 1) {
								gameState = 'lost';
								isSubmitting = false;
								saveCompletion();
							}
						}, i * 600);
					});
				}, 800);
			} else {
				setTimeout(() => {
					shakingWords = [];
				}, 500);
			}
		}
	}

	function shuffleRemaining() {
		const solved = solvedGroups.flatMap((g) => g.words) as string[];
		const unsolved = shuffledWords.filter((w) => !solved.includes(w));
		const reshuffled = shuffle(unsolved);
		shuffledWords = [...solved, ...reshuffled];
	}

	function deselectAll() {
		selectedWords = [];
		feedback = null;
	}

	function saveCompletion() {
		const key = `connections-${getTodayDateString()}`;
		localStorage.setItem(key, JSON.stringify({ state: gameState, mistakes }));
	}

	function loadSavedGame(): boolean {
		try {
			const key = `connections-${getTodayDateString()}`;
			const saved = localStorage.getItem(key);
			if (!saved) return false;
			const data = JSON.parse(saved);
			gameState = data.state;
			mistakes = data.mistakes;
			solvedGroups = [...puzzle.groups].sort((a, b) => a.difficulty - b.difficulty);
			shuffledWords = puzzle.groups.flatMap((g) => g.words);
			selectedWords = [];
			shakingWords = [];
			bouncingWords = [];
			coloringWords = [];
			coloringGroup = null;
			isSubmitting = false;
			feedback = null;
			return true;
		} catch {
			return false;
		}
	}

	$effect(() => {
		if (!loadSavedGame()) {
			initGame();
		}
	});

	// Countdown timer to next puzzle
	$effect(() => {
		if (gameState !== 'playing') {
			const update = () => {
				const ms = getMillisUntilMidnight();
				if (ms <= 0) {
					// New day — reload the game
					if (!loadSavedGame()) {
						initGame();
					}
					return;
				}
				const h = Math.floor(ms / 3600000);
				const m = Math.floor((ms % 3600000) / 60000);
				const s = Math.floor((ms % 60000) / 1000);
				countdown = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
			};
			update();
			const interval = setInterval(update, 1000);
			return () => clearInterval(interval);
		}
	});

	const difficultyColors = [
		'bg-yellow-400 text-yellow-950',
		'bg-green-500 text-green-950',
		'bg-blue-500 text-blue-950',
		'bg-purple-500 text-purple-950'
	];

	const difficultyInlineColors = ['#facc15', '#22c55e', '#3b82f6', '#a855f7'];

	function tileStyle(word: string): string {
		const bounceIdx = bouncingWords.indexOf(word);
		const bounceStyle = bounceIdx >= 0 ? `animation-delay: ${bounceIdx * 100}ms;` : '';

		if (coloringWords.includes(word) && coloringGroup) {
			return `${bounceStyle} background-color: ${difficultyInlineColors[coloringGroup.difficulty]}; color: #1c1917; transition: background-color 0.2s, color 0.2s;`;
		}

		return bounceStyle;
	}
</script>

<div
	class="@container relative flex h-full w-full flex-col gap-1 overflow-hidden p-2 @xs:gap-1.5 @xs:p-3 @sm:gap-2 @sm:p-4"
>
	<p
		class="accent:text-accent-950 text-center text-[0.5rem] font-semibold text-stone-700 @xs:text-xs @sm:text-sm dark:text-stone-300"
	>
		Create four groups of four!
	</p>

	<!-- Single grid for solved rows + remaining tiles -->
	<div class="grid min-h-0 flex-1 grid-cols-4 gap-1 @xs:gap-1.5 @sm:gap-2">
		{#each [...solvedGroups].sort((a, b) => a.difficulty - b.difficulty) as group (group.category)}
			<div
				class="row-pop {difficultyColors[
					group.difficulty
				]} col-span-4 flex flex-col items-center justify-center rounded-lg text-center"
			>
				<span class="text-[0.5rem] font-bold uppercase @xs:text-xs @sm:text-sm"
					>{group.category}</span
				>
				<span class="text-[0.45rem] @xs:text-[0.65rem] @sm:text-xs">{group.words.join(', ')}</span>
			</div>
		{/each}

		{#each remainingWords as word (word)}
			<button
				animate:flip={{ duration: 400 }}
				class="min-h-0 cursor-pointer rounded-lg text-[0.5rem] font-bold uppercase @xs:text-xs @sm:text-sm {coloringWords.includes(
					word
				)
					? ''
					: selectedWords.includes(word)
						? 'accent:bg-accent-900 accent:text-accent-100 bg-stone-600 text-white dark:bg-stone-300 dark:text-stone-900'
						: 'accent:bg-accent-200/40 accent:text-accent-950 bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100'} {shakingWords.includes(
					word
				)
					? 'shake'
					: ''} {bouncingWords.includes(word) ? 'bounce' : ''}"
				style={tileStyle(word)}
				onclick={() => toggleWord(word)}
				disabled={gameState !== 'playing' || isSubmitting}
			>
				{word}
			</button>
		{/each}
	</div>

	{#if feedback}
		<div
			class="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex justify-center"
			transition:fade={{ duration: 300 }}
		>
			<span
				class="rounded-full bg-stone-800 px-3 py-1 text-[0.6rem] font-semibold text-white shadow-lg @xs:text-xs @sm:text-sm dark:bg-stone-200 dark:text-stone-900"
			>
				{feedback}
			</span>
		</div>
	{/if}

	<div
		class="accent:text-accent-950/80 flex items-center justify-center gap-1 text-[0.5rem] text-stone-600 @xs:text-xs dark:text-stone-400"
	>
		<span>Mistakes remaining:</span>
		<div class="flex gap-0.5">
			{#each Array(4) as _, i (i)}
				<span
					class="inline-block size-2 rounded-full @xs:size-2.5 {i < 4 - mistakes
						? 'accent:bg-accent-950 bg-stone-700 dark:bg-stone-300'
						: 'accent:bg-accent-950/30 bg-stone-300 dark:bg-stone-600'}"
				></span>
			{/each}
		</div>
	</div>

	<div class="flex items-center justify-center gap-1.5 @xs:gap-2">
		{#if gameState === 'playing'}
			<button
				class="accent:border-accent-900/40 accent:text-accent-950 accent:hover:bg-accent-900/10 cursor-pointer rounded-full border border-stone-400 px-2 py-0.5 text-[0.5rem] font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 @xs:px-3 @xs:py-1 @xs:text-xs dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={shuffleRemaining}
				disabled={isSubmitting}
			>
				Shuffle
			</button>
			<button
				class="accent:border-accent-900/40 accent:text-accent-950 accent:hover:bg-accent-900/10 cursor-pointer rounded-full border border-stone-400 px-2 py-0.5 text-[0.5rem] font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 @xs:px-3 @xs:py-1 @xs:text-xs dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={deselectAll}
				disabled={selectedWords.length === 0 || isSubmitting}
			>
				Deselect All
			</button>
			<button
				class="accent:border-accent-900/40 accent:text-accent-950 accent:hover:bg-accent-900/10 cursor-pointer rounded-full border border-stone-400 px-2 py-0.5 text-[0.5rem] font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 @xs:px-3 @xs:py-1 @xs:text-xs dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={submitGuess}
				disabled={selectedWords.length !== 4 || isSubmitting}
			>
				Submit
			</button>
		{:else}
			<span
				class="accent:text-accent-950/70 text-[0.5rem] text-stone-500 @xs:text-xs dark:text-stone-400"
			>
				Next puzzle in {countdown}
			</span>
		{/if}
	</div>
</div>

<style>
	/* Wrong guess: tiles shake side to side */
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

	/* Correct guess: NYT-style staggered bounce on each tile */
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

	/* Solved row pop-in with bounce */
	@keyframes row-pop {
		0% {
			opacity: 0;
			transform: scaleY(0.7);
		}
		50% {
			opacity: 1;
			transform: scaleY(1.06);
		}
		75% {
			transform: scaleY(0.97);
		}
		100% {
			transform: scaleY(1);
		}
	}
	.row-pop {
		animation: row-pop 0.5s ease-out both;
	}
</style>
