<script lang="ts">
	import { dev } from '$app/environment';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { getMillisUntilMidnight } from './daily';
	import type { ConnectionsGroup, ConnectionsPuzzle } from './types';

	let { puzzle, puzzleId }: { puzzle: ConnectionsPuzzle; puzzleId: number } = $props();

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
	let hintWords: Map<string, number> = $state(new Map());
	let boardEl: HTMLDivElement | undefined = $state();
	let boardWidth: number = $state(0);
	let isDark = $state(false);

	$effect(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		// Also check for .dark class on document
		const check = () => {
			isDark = document.documentElement.classList.contains('dark') || mq.matches;
		};
		check();
		const observer = new MutationObserver(check);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		mq.addEventListener('change', check);
		return () => {
			observer.disconnect();
			mq.removeEventListener('change', check);
		};
	});

	const GAP = 8;

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

		hintWords = new Map();

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
						solvedGroups = [...solvedGroups, matchedGroup].sort(
							(a, b) => a.difficulty - b.difficulty
						);
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

	function showHint() {
		if (gameState !== 'playing' || isSubmitting) return;
		selectedWords = [];
		const unsolved = puzzle.groups.filter((g) => !solvedGroups.includes(g));
		const map = new Map<string, number>();
		for (const group of unsolved) {
			map.set(group.words[0], group.difficulty);
		}
		hintWords = map;
	}

	function saveCompletion() {
		const key = `connections-${puzzleId}`;
		localStorage.setItem(key, JSON.stringify({ state: gameState, mistakes }));
	}

	function loadSavedGame(): boolean {
		try {
			const key = `connections-${puzzleId}`;
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
		'bg-yellow-400 dark:bg-yellow-600 text-stone-900 dark:text-stone-100',
		'bg-green-400 dark:bg-green-600 text-stone-900 dark:text-stone-100',
		'bg-blue-400 dark:bg-blue-600 text-stone-900 dark:text-stone-100',
		'bg-purple-400 dark:bg-purple-600 text-stone-900 dark:text-stone-100'
	];

	const difficultyInlineColors: [string, string][] = [
		['#facc15', '#ca8a04'],
		['#4ade80', '#16a34a'],
		['#60a5fa', '#2563eb'],
		['#c084fc', '#9333ea']
	];

	function inlineColor(difficulty: number): string {
		return difficultyInlineColors[difficulty][isDark ? 1 : 0];
	}

	function tileStyle(word: string): string {
		const bounceIdx = bouncingWords.indexOf(word);
		const bounceStyle = bounceIdx >= 0 ? `animation-delay: ${bounceIdx * 100}ms;` : '';
		const textColor = isDark ? '#fafaf9' : '#1c1917';

		if (coloringWords.includes(word) && coloringGroup) {
			return `${bounceStyle} background-color: ${inlineColor(coloringGroup.difficulty)}; color: ${textColor}; transition: background-color 0.2s, color 0.2s;`;
		}

		if (hintWords.has(word)) {
			return `${bounceStyle} background-color: ${inlineColor(hintWords.get(word)!)}; color: ${textColor}; transition: background-color 0.3s, color 0.3s;`;
		}

		return bounceStyle;
	}
</script>

<div class="relative flex w-full flex-col gap-4 px-2 py-4 sm:px-4">
	<p class="text-center text-sm font-semibold text-stone-700 dark:text-stone-300">
		Create four groups of four!
	</p>

	<div
		bind:this={boardEl}
		class="relative w-full"
		style:height="{tileSize * 4 + GAP * 3}px"
	>
		{#each solvedGroups as group, i (group.category)}
			<div
				class="row-pop {difficultyColors[group.difficulty]} absolute flex flex-col items-center justify-center overflow-hidden rounded-lg text-center"
				style:top="{i * (tileSize + GAP)}px"
				style:left="0"
				style:width="{boardWidth}px"
				style:height="{tileSize}px"
			>
				<span class="text-base font-extrabold sm:text-2xl">{group.category}</span>
				<span class="text-sm font-semibold leading-tight sm:text-lg">{group.words.join(', ')}</span>
			</div>
		{/each}

		{#each remainingWords as word, idx (word)}
			{@const row = solvedGroups.length + Math.floor(idx / 4)}
			{@const col = idx % 4}
			<button
				animate:flip={{ duration: 400 }}
				class="absolute flex cursor-pointer items-center justify-center overflow-hidden break-all rounded-lg px-1 text-center text-sm leading-tight font-extrabold uppercase hyphens-auto sm:text-lg {coloringWords.includes(
					word
				)
					? ''
					: selectedWords.includes(word)
						? 'bg-stone-600 text-white dark:bg-stone-300 dark:text-stone-900'
						: 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100'} {shakingWords.includes(
					word
				)
					? 'shake'
					: ''} {bouncingWords.includes(word) ? 'bounce' : ''}"
				style="{tileStyle(word)} top: {row * (tileSize + GAP)}px; left: {col * (tileSize + GAP)}px; width: {tileSize}px; height: {tileSize}px;"
				onclick={() => toggleWord(word)}
				disabled={gameState !== 'playing' || isSubmitting}
			lang="en"
			>
				<span class="max-w-full">{word.toLowerCase()}</span>
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
			<button
				class="cursor-pointer rounded-full border border-stone-400 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-500 dark:text-stone-300 dark:hover:bg-stone-700"
				onclick={showHint}
				disabled={isSubmitting}
			>
				Hint
			</button>
		{:else}
			<span class="text-xs text-stone-500 dark:text-stone-400">
				Next puzzle in {countdown}
			</span>
		{/if}
		{#if dev}
			<button
				class="cursor-pointer rounded-full border border-red-400 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/30"
				onclick={() => {
					localStorage.removeItem(`connections-${puzzleId}`);
					initGame();
				}}
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
