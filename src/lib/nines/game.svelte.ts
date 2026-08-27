import type { Grid, NinesPuzzle, CellPosition } from './types';

type HistoryEntry = {
	row: number;
	col: number;
	prevValue: number;
	prevNotes: Set<number>;
};

export class NinesGame {
	grid: Grid = $state([]);
	notes: Set<number>[][] = $state([]);
	selectedCell: CellPosition | null = $state(null);
	mistakes: number = $state(0);
	gameState: 'playing' | 'won' | 'lost' = $state('playing');
	noteMode: boolean = $state(false);
	elapsed: number = $state(0);
	errorCells: Set<string> = $state(new Set());

	private initial: Grid;
	private solution: Grid;
	private history: HistoryEntry[] = $state([]);
	private timerInterval: ReturnType<typeof setInterval> | null = null;

	get isInitialCell(): (row: number, col: number) => boolean {
		return (row: number, col: number) => this.initial[row][col] !== 0;
	}

	get filledCount(): number {
		let count = 0;
		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				if (this.grid[r][c] !== 0) count++;
			}
		}
		return count;
	}

	get formattedTime(): string {
		const m = Math.floor(this.elapsed / 60);
		const s = this.elapsed % 60;
		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	constructor(private puzzle: NinesPuzzle) {
		this.initial = puzzle.initial.map((r) => [...r]);
		this.solution = puzzle.solution;
		this.grid = puzzle.initial.map((r) => [...r]);
		const notes: Set<number>[][] = [];
		for (let row = 0; row < 9; row++) {
			const rowNotes: Set<number>[] = [];
			for (let col = 0; col < 9; col++) {
				const cellNotes = new Set<number>();
				rowNotes.push(cellNotes);
			}
			notes.push(rowNotes);
		}
		this.notes = notes;
		this.startTimer();
	}

	private startTimer() {
		this.stopTimer();
		this.timerInterval = setInterval(() => {
			if (this.gameState === 'playing') {
				this.elapsed++;
			}
		}, 1000);
	}

	private stopTimer() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}

	selectCell(row: number, col: number) {
		if (this.gameState !== 'playing') return;
		this.selectedCell = { row, col };
	}

	enterNumber(num: number) {
		if (!this.selectedCell || this.gameState !== 'playing') return;
		const { row, col } = this.selectedCell;
		if (this.initial[row][col] !== 0) return;

		if (this.noteMode) {
			const newNotes = this.notes.map((r) => r.map((s) => new Set(s)));
			if (newNotes[row][col].has(num)) {
				newNotes[row][col].delete(num);
			} else {
				newNotes[row][col].add(num);
			}
			this.notes = newNotes;
			return;
		}

		// Save history for undo
		this.history = [
			...this.history,
			{
				row,
				col,
				prevValue: this.grid[row][col],
				prevNotes: new Set(this.notes[row][col])
			}
		];

		const newGrid = this.grid.map((r) => [...r]);
		newGrid[row][col] = num;
		this.grid = newGrid;

		// Clear notes for this cell
		const newNotes = this.notes.map((r) => r.map((s) => new Set(s)));
		newNotes[row][col].clear();
		this.notes = newNotes;

		// Check if correct
		if (num !== this.solution[row][col]) {
			this.mistakes++;
			const newErrors = new Set(this.errorCells);
			newErrors.add(`${row},${col}`);
			this.errorCells = newErrors;

			if (this.mistakes >= 3) {
				this.gameState = 'lost';
				this.stopTimer();
			}
		} else {
			// Remove from errors if previously wrong and now correct
			const newErrors = new Set(this.errorCells);
			newErrors.delete(`${row},${col}`);
			this.errorCells = newErrors;

			// Remove this number from notes in same row/col/box
			this.clearRelatedNotes(row, col, num);

			// Check win
			if (this.checkWin()) {
				this.gameState = 'won';
				this.stopTimer();
			}
		}
	}

	private clearRelatedNotes(row: number, col: number, num: number) {
		const newNotes = this.notes.map((r) => r.map((s) => new Set(s)));
		// Row
		for (let c = 0; c < 9; c++) newNotes[row][c].delete(num);
		// Column
		for (let r = 0; r < 9; r++) newNotes[r][col].delete(num);
		// Box
		const boxRow = Math.floor(row / 3) * 3;
		const boxCol = Math.floor(col / 3) * 3;
		for (let r = boxRow; r < boxRow + 3; r++) {
			for (let c = boxCol; c < boxCol + 3; c++) {
				newNotes[r][c].delete(num);
			}
		}
		this.notes = newNotes;
	}

	erase() {
		if (!this.selectedCell || this.gameState !== 'playing') return;
		const { row, col } = this.selectedCell;
		if (this.initial[row][col] !== 0) return;

		this.history = [
			...this.history,
			{
				row,
				col,
				prevValue: this.grid[row][col],
				prevNotes: new Set(this.notes[row][col])
			}
		];

		const newGrid = this.grid.map((r) => [...r]);
		newGrid[row][col] = 0;
		this.grid = newGrid;

		const newErrors = new Set(this.errorCells);
		newErrors.delete(`${row},${col}`);
		this.errorCells = newErrors;
	}

	undo() {
		if (this.history.length === 0 || this.gameState !== 'playing') return;
		const entry = this.history[this.history.length - 1];
		this.history = this.history.slice(0, -1);

		const newGrid = this.grid.map((r) => [...r]);
		newGrid[entry.row][entry.col] = entry.prevValue;
		this.grid = newGrid;

		const newNotes = this.notes.map((r) => r.map((s) => new Set(s)));
		newNotes[entry.row][entry.col] = new Set(entry.prevNotes);
		this.notes = newNotes;

		// Re-evaluate errors
		const newErrors = new Set(this.errorCells);
		if (entry.prevValue !== 0 && entry.prevValue !== this.solution[entry.row][entry.col]) {
			newErrors.add(`${entry.row},${entry.col}`);
		} else {
			newErrors.delete(`${entry.row},${entry.col}`);
		}
		this.errorCells = newErrors;
	}

	private checkWin(): boolean {
		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				if (this.grid[r][c] !== this.solution[r][c]) return false;
			}
		}
		return true;
	}

	toggleNoteMode() {
		this.noteMode = !this.noteMode;
	}

	cellClasses(row: number, col: number): string {
		const isSelected = this.selectedCell?.row === row && this.selectedCell?.col === col;
		const isError = this.errorCells.has(`${row},${col}`);
		const isInitial = this.initial[row][col] !== 0;
		const value = this.grid[row][col];

		// Highlight cells with same number as selected
		const selectedValue = this.selectedCell
			? this.grid[this.selectedCell.row][this.selectedCell.col]
			: 0;
		const isSameNumber = value !== 0 && selectedValue !== 0 && value === selectedValue;

		// Highlight same row/col/box as selected
		const isRelated =
			this.selectedCell !== null &&
			!isSelected &&
			(row === this.selectedCell.row ||
				col === this.selectedCell.col ||
				(Math.floor(row / 3) === Math.floor(this.selectedCell.row / 3) &&
					Math.floor(col / 3) === Math.floor(this.selectedCell.col / 3)));

		if (isSelected) {
			return 'bg-blue-200 dark:bg-blue-800';
		}
		if (isError) {
			return 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950';
		}
		if (isSameNumber && !isSelected) {
			return 'bg-blue-100 dark:bg-blue-900';
		}
		if (isRelated) {
			return 'bg-base-100 dark:bg-base-800';
		}
		if (isInitial) {
			return 'text-base-900 dark:text-base-100';
		}
		return 'text-blue-600 dark:text-blue-400';
	}

	destroy() {
		this.stopTimer();
	}
}
