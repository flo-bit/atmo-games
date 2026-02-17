<script lang="ts">
	import { dev } from '$app/environment';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { getTodayDateString, getMillisUntilMidnight } from './daily';
	import type { ConnectionsGroup, ConnectionsPuzzle } from './types';

	let { puzzle }: { puzzle: ConnectionsPuzzle } = $props();

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

			// Step 1: staggered bounce on selected tiles
			bouncingWords = [...matched];

			setTimeout(() => {
				bouncingWords = [];

				// Step 2: slide matched tiles to top of remaining (flip animates this)
				const solvedWordSet = new Set(solvedGroups.flatMap((g) => g.words) as string[]);
				const matchedSet = new Set(matched);
				const solvedPart = shuffledWords.filter((w) => solvedWordSet.has(w));
				const others = shuffledWords.filter((w) => !solvedWordSet.has(w) && !matchedSet.has(w));
				shuffledWords = [...solvedPart, ...matched, ...others];

				setTimeout(() => {
					// Step 3: color flash the top row
					coloringWords = [...matched];
					coloringGroup = matchedGroup;

					setTimeout(() => {
						// Step 4: collapse into solved row
						coloringWords = [];
						coloringGroup = null;
						selectedWords = [];
						solvedGroups = [...solvedGroups, matchedGroup].sort((a, b) => a.difficulty - b.difficulty);
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

	$effect(() => {
		if (gameState !== 'playing') {
			const update = () => {
				const ms = getMillisUntilMidnight();
				if (ms <= 0) {
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

<div class="relative flex w-full flex-col gap-4 p-4">
	<p class="text-center text-sm font-semibold text-stone-700 dark:text-stone-300">
		Create four groups of four!
	</p>

	<div class="game-grid grid grid-cols-4 grid-rows-4 gap-2">
		{#each solvedGroups as group (group.category)}
			<div
				class="row-pop {difficultyColors[group.difficulty]} col-span-4 flex flex-col items-center justify-center rounded-lg text-center"
			>
				<span class="text-lg font-bold uppercase">{group.category}</span>
				<span class="text-base">{group.words.join(', ')}</span>
			</div>
		{/each}

		{#each remainingWords as word (word)}
			<button
				animate:flip={{ duration: 400 }}
				class="flex cursor-pointer items-center justify-center rounded-lg text-sm font-bold uppercase {coloringWords.includes(word)
					? ''
					: selectedWords.includes(word)
						? 'bg-stone-600 text-white dark:bg-stone-300 dark:text-stone-900'
						: 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100'} {shakingWords.includes(word)
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
				class="rounded-full bg-stone-800 px-3 py-1 text-sm font-semibold text-white shadow-lg dark:bg-stone-200 dark:text-stone-900"
			>
				{feedback}
			</span>
		</div>
	{/if}

	<div class="flex items-center justify-center gap-1 text-xs text-stone-600 dark:text-stone-400">
		<span>Mistakes remaining:</span>
		<div class="flex gap-0.5">
			{#each Array(4) as _, i (i)}
				<span
					class="inline-block size-2.5 rounded-full {i < 4 - mistakes
						? 'bg-stone-700 dark:bg-stone-300'
						: 'bg-stone-300 dark:bg-stone-600'}"
				></span>
			{/each}
		</div>
	</div>

	<div class="flex items-center justify-center gap-2">
		{#if gameState === 'playing'}
			<button
				class="cursor-pointer rounded-full border border-stone-400 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={shuffleRemaining}
				disabled={isSubmitting}
			>
				Shuffle
			</button>
			<button
				class="cursor-pointer rounded-full border border-stone-400 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={deselectAll}
				disabled={selectedWords.length === 0 || isSubmitting}
			>
				Deselect All
			</button>
			<button
				class="cursor-pointer rounded-full border border-stone-400 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={submitGuess}
				disabled={selectedWords.length !== 4 || isSubmitting}
			>
				Submit
			</button>
		{:else}
			<span class="text-xs text-stone-500 dark:text-stone-400">
				Next puzzle in {countdown}
			</span>
		{/if}
		{#if dev}
			<button
				class="cursor-pointer rounded-full border border-red-400 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/30"
				onclick={() => { localStorage.removeItem(`connections-${getTodayDateString()}`); initGame(); }}
			>
				Reset
			</button>
		{/if}
	</div>
</div>

<style>
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20% { transform: translateX(-4px); }
		40% { transform: translateX(4px); }
		60% { transform: translateX(-4px); }
		80% { transform: translateX(2px); }
	}
	.shake { animation: shake 0.5s ease-in-out; }

	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		40% { transform: translateY(-12px); }
		60% { transform: translateY(-4px); }
	}
	.bounce { animation: bounce 0.4s ease-in-out both; }

	@keyframes row-pop {
		0% { opacity: 0; transform: scaleY(0.7); }
		50% { opacity: 1; transform: scaleY(1.06); }
		75% { transform: scaleY(0.97); }
		100% { transform: scaleY(1); }
	}
	.row-pop { animation: row-pop 0.5s ease-out both; }

	/* Lock the grid to a square so rows never shift during animations */
	.game-grid { aspect-ratio: 1 / 1; }
</style>
