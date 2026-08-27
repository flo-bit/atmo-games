export type Grid = number[][]; // 9x9, 0 = empty

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type NinesPuzzle = {
	initial: Grid;
	solution: Grid;
	difficulty: Difficulty;
};

export type CellPosition = {
	row: number;
	col: number;
};
