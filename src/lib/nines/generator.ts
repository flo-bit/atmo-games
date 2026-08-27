import type { Grid, Difficulty, NinesPuzzle } from './types';

function createEmptyGrid(): Grid {
	return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValid(grid: Grid, row: number, col: number, num: number): boolean {
	// Check row
	for (let c = 0; c < 9; c++) {
		if (grid[row][c] === num) return false;
	}
	// Check column
	for (let r = 0; r < 9; r++) {
		if (grid[r][col] === num) return false;
	}
	// Check 3x3 box
	const boxRow = Math.floor(row / 3) * 3;
	const boxCol = Math.floor(col / 3) * 3;
	for (let r = boxRow; r < boxRow + 3; r++) {
		for (let c = boxCol; c < boxCol + 3; c++) {
			if (grid[r][c] === num) return false;
		}
	}
	return true;
}

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

function solve(grid: Grid): boolean {
	for (let row = 0; row < 9; row++) {
		for (let col = 0; col < 9; col++) {
			if (grid[row][col] === 0) {
				const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
				for (const num of nums) {
					if (isValid(grid, row, col, num)) {
						grid[row][col] = num;
						if (solve(grid)) return true;
						grid[row][col] = 0;
					}
				}
				return false;
			}
		}
	}
	return true;
}

function countSolutions(grid: Grid, limit: number = 2): number {
	let count = 0;
	function search(): boolean {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (grid[row][col] === 0) {
					for (let num = 1; num <= 9; num++) {
						if (isValid(grid, row, col, num)) {
							grid[row][col] = num;
							if (search()) return true;
							grid[row][col] = 0;
						}
					}
					return false;
				}
			}
		}
		count++;
		return count >= limit;
	}
	search();
	return count;
}

const CLUES_BY_DIFFICULTY: Record<Difficulty, number> = {
	easy: 38,
	medium: 30,
	hard: 25,
	expert: 22
};

function copyGrid(grid: Grid): Grid {
	return grid.map((row) => [...row]);
}

export function generatePuzzle(difficulty: Difficulty = 'medium'): NinesPuzzle {
	// Generate a complete solution
	const solution = createEmptyGrid();
	solve(solution);

	// Remove cells to create the puzzle
	const puzzle = copyGrid(solution);
	const targetClues = CLUES_BY_DIFFICULTY[difficulty];
	let currentClues = 81;

	const positions = shuffle(
		Array.from({ length: 81 }, (_, i) => ({
			row: Math.floor(i / 9),
			col: i % 9
		}))
	);

	for (const { row, col } of positions) {
		if (currentClues <= targetClues) break;
		const backup = puzzle[row][col];
		puzzle[row][col] = 0;

		if (countSolutions(copyGrid(puzzle)) === 1) {
			currentClues--;
		} else {
			puzzle[row][col] = backup;
		}
	}

	return {
		initial: puzzle,
		solution: copyGrid(solution),
		difficulty
	};
}
