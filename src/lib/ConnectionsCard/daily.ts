import { PUZZLES } from './puzzles';

export const START_DATE = '2026-02-10';

export function getTodayDateString(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getTodayPuzzleIndex(): number {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const start = new Date(START_DATE + 'T00:00:00');
	const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
	return Math.max(0, Math.min(diffDays, PUZZLES.length - 1));
}

export function getMillisUntilMidnight(): number {
	const now = new Date();
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0);
	return tomorrow.getTime() - now.getTime();
}
