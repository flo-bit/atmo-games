import { getMillisUntilMidnight } from './daily';
import type { ConnectionsGroup, ConnectionsPuzzle } from './types';

export const GAP = 8;

export const DIFFICULTY_COLORS = [
	'bg-yellow-400 dark:bg-yellow-600 text-stone-900 dark:text-stone-100',
	'bg-green-400 dark:bg-green-600 text-stone-900 dark:text-stone-100',
	'bg-blue-400 dark:bg-blue-600 text-stone-900 dark:text-stone-100',
	'bg-purple-400 dark:bg-purple-600 text-stone-900 dark:text-stone-100'
];

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ConnectionsGame {
	shuffledWords: string[] = $state([]);
	selectedWords: string[] = $state([]);
	solvedGroups: ConnectionsGroup[] = $state([]);
	mistakes: number = $state(0);
	gameState: 'playing' | 'won' | 'lost' = $state('playing');
	feedback: string | null = $state(null);
	shakingWords: string[] = $state([]);
	bouncingWords: string[] = $state([]);
	coloringWords: string[] = $state([]);
	coloringGroup: ConnectionsGroup | null = $state(null);
	isSubmitting: boolean = $state(false);
	countdown: string = $state('');
	hintWords: Map<string, number> = $state(new Map());

	get remainingWords(): string[] {
		return this.shuffledWords.filter(
			(word) => !this.solvedGroups.some((group) => group.words.includes(word as never))
		);
	}

	constructor(
		private puzzle: ConnectionsPuzzle,
		private puzzleId: number
	) {
		$effect(() => {
			if (!this.loadSavedGame()) {
				this.initGame();
			}
		});

		$effect(() => {
			if (this.gameState !== 'playing') {
				const update = () => {
					const ms = getMillisUntilMidnight();
					if (ms <= 0) {
						if (!this.loadSavedGame()) {
							this.initGame();
						}
						return;
					}
					const h = Math.floor(ms / 3600000);
					const m = Math.floor((ms % 3600000) / 60000);
					const s = Math.floor((ms % 60000) / 1000);
					this.countdown = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
				};
				update();
				const interval = setInterval(update, 1000);
				return () => clearInterval(interval);
			}
		});
	}

	initGame() {
		const allWords = this.puzzle.groups.flatMap((g) => g.words);
		this.shuffledWords = shuffle(allWords);
		this.selectedWords = [];
		this.solvedGroups = [];
		this.mistakes = 0;
		this.gameState = 'playing';
		this.feedback = null;
		this.shakingWords = [];
		this.bouncingWords = [];
		this.coloringWords = [];
		this.coloringGroup = null;
		this.isSubmitting = false;
	}

	toggleWord(word: string) {
		if (this.gameState !== 'playing' || this.isSubmitting) return;
		if (this.solvedGroups.some((g) => g.words.includes(word as never))) return;

		this.hintWords = new Map();

		if (this.selectedWords.includes(word)) {
			this.selectedWords = this.selectedWords.filter((w) => w !== word);
		} else if (this.selectedWords.length < 4) {
			this.selectedWords = [...this.selectedWords, word];
		}
		this.feedback = null;
	}

	async submitGuess() {
		if (this.selectedWords.length !== 4 || this.gameState !== 'playing' || this.isSubmitting)
			return;

		const matchedGroup = this.puzzle.groups.find(
			(group) =>
				!this.solvedGroups.includes(group) &&
				this.selectedWords.every((w) => group.words.includes(w as never))
		);

		if (matchedGroup) {
			this.isSubmitting = true;
			const matched = [...this.selectedWords];

			this.bouncingWords = [...matched];
			await delay(700);
			this.bouncingWords = [];

			const solvedWordSet = new Set(this.solvedGroups.flatMap((g) => g.words) as string[]);
			const matchedSet = new Set(matched);
			const solvedPart = this.shuffledWords.filter((w) => solvedWordSet.has(w));
			const others = this.shuffledWords.filter(
				(w) => !solvedWordSet.has(w) && !matchedSet.has(w)
			);
			this.shuffledWords = [...solvedPart, ...matched, ...others];

			await delay(500);
			this.coloringWords = [...matched];
			this.coloringGroup = matchedGroup;

			await delay(400);
			this.coloringWords = [];
			this.coloringGroup = null;
			this.selectedWords = [];
			this.solvedGroups = [...this.solvedGroups, matchedGroup].sort(
				(a, b) => a.difficulty - b.difficulty
			);
			this.isSubmitting = false;

			if (this.solvedGroups.length === 4) {
				this.gameState = 'won';
				this.saveCompletion();
			}
		} else {
			const almostGroup = this.puzzle.groups.find(
				(group) =>
					!this.solvedGroups.includes(group) &&
					this.selectedWords.filter((w) => group.words.includes(w as never)).length === 3
			);

			if (almostGroup) {
				this.feedback = 'One away!';
				setTimeout(() => {
					if (this.feedback === 'One away!') this.feedback = null;
				}, 2000);
			}

			this.shakingWords = [...this.selectedWords];
			this.mistakes += 1;
			this.selectedWords = [];

			if (this.mistakes >= 4) {
				this.isSubmitting = true;
				await delay(800);

				this.shakingWords = [];
				const unsolved = this.puzzle.groups
					.filter((g) => !this.solvedGroups.includes(g))
					.sort((a, b) => a.difficulty - b.difficulty);

				unsolved.forEach(async (group, i) => {
					await delay(i * 600);
					this.solvedGroups = [...this.solvedGroups, group];
					if (i === unsolved.length - 1) {
						this.gameState = 'lost';
						this.isSubmitting = false;
						this.saveCompletion();
					}
				});
			} else {
				await delay(500);
				this.shakingWords = [];
			}
		}
	}

	shuffleRemaining() {
		const solved = this.solvedGroups.flatMap((g) => g.words) as string[];
		const unsolved = this.shuffledWords.filter((w) => !solved.includes(w));
		this.shuffledWords = [...solved, ...shuffle(unsolved)];
	}

	deselectAll() {
		this.selectedWords = [];
		this.feedback = null;
	}

	showHint() {
		if (this.gameState !== 'playing' || this.isSubmitting) return;
		this.selectedWords = [];
		const unsolved = this.puzzle.groups.filter((g) => !this.solvedGroups.includes(g));
		const map = new Map<string, number>();
		for (const group of unsolved) {
			map.set(group.words[0], group.difficulty);
		}
		this.hintWords = map;
	}

	tileClasses(word: string): string {
		if (this.coloringWords.includes(word) && this.coloringGroup) {
			return `${DIFFICULTY_COLORS[this.coloringGroup.difficulty]} transition-colors duration-200`;
		}
		if (this.hintWords.has(word)) {
			return `${DIFFICULTY_COLORS[this.hintWords.get(word)!]} transition-colors duration-300`;
		}
		if (this.selectedWords.includes(word)) {
			return 'bg-stone-600 text-white dark:bg-stone-300 dark:text-stone-900';
		}
		return 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100';
	}

	tileStyle(word: string): string {
		const bounceIdx = this.bouncingWords.indexOf(word);
		return bounceIdx >= 0 ? `animation-delay: ${bounceIdx * 100}ms;` : '';
	}

	private saveCompletion() {
		const key = `connections-${this.puzzleId}`;
		localStorage.setItem(key, JSON.stringify({ state: this.gameState, mistakes: this.mistakes }));
	}

	private loadSavedGame(): boolean {
		try {
			const key = `connections-${this.puzzleId}`;
			const saved = localStorage.getItem(key);
			if (!saved) return false;
			const data = JSON.parse(saved);
			this.gameState = data.state;
			this.mistakes = data.mistakes;
			this.solvedGroups = [...this.puzzle.groups].sort((a, b) => a.difficulty - b.difficulty);
			this.shuffledWords = this.puzzle.groups.flatMap((g) => g.words);
			this.selectedWords = [];
			this.shakingWords = [];
			this.bouncingWords = [];
			this.coloringWords = [];
			this.coloringGroup = null;
			this.isSubmitting = false;
			this.feedback = null;
			return true;
		} catch {
			return false;
		}
	}

	reset() {
		localStorage.removeItem(`connections-${this.puzzleId}`);
		this.initGame();
	}
}
