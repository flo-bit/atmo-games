import { base } from '$app/paths';
import type { ConnectionsPuzzle } from './types';

export const START_DATE = '2026-02-10';
export const TOTAL_PUZZLES = 30;

export function getTodayDateString(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getTodayPuzzleIndex(): number {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const start = new Date(START_DATE + 'T00:00:00');
	const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
	return Math.max(0, Math.min(diffDays, TOTAL_PUZZLES - 1));
}

export async function fetchPuzzle(index: number): Promise<ConnectionsPuzzle> {
	const res = await fetch(`${base}/fours/puzzles/${index + 1}.json`);
	return res.json();
}

export function getMillisUntilMidnight(): number {
	const now = new Date();
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0);
	return tomorrow.getTime() - now.getTime();
}
