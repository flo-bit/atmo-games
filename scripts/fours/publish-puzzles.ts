#!/usr/bin/env npx tsx
import type {} from '@atcute/atproto';
import type {} from '../../src/lib/contrail/types/index.js';
import { Client } from '@atcute/client';
import { PasswordSession } from '@atcute/password-session';
import { createTID } from '@svelte-atproto/oauth/helper';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── types ───────────────────────────────────────────────────────────────────
interface FoursGroup {
	category: string;
	words: [string, string, string, string];
	difficulty: 0 | 1 | 2 | 3;
}

interface FoursPuzzle {
	groups: [FoursGroup, FoursGroup, FoursGroup, FoursGroup];
}

// ── config ──────────────────────────────────────────────────────────────────
interface Config {
	handle: string;
	appPassword: string;
	dir: string;
	dryRun: boolean;
	allowDaily: boolean;
}

function usage(exitCode = 1): never {
	console.log(`
Usage: npx tsx scripts/fours/publish-puzzles.ts [options]

Required:
  --handle       Bluesky handle (e.g. alice.bsky.social)
  --password     App password
  --dir          Directory containing 1.json, 2.json, etc.

Optional:
  --allow-daily  Set allowDaily flag on all puzzles (default: false)
  --dry-run      Validate puzzles without publishing
  --help         Show this help
`);
	process.exit(exitCode);
}

function parseArgs(): Config {
	const args = process.argv.slice(2);
	const get = (flag: string): string | undefined => {
		const i = args.indexOf(flag);
		return i !== -1 ? args[i + 1] : undefined;
	};
	const has = (flag: string) => args.includes(flag);

	if (has('--help') || has('-h')) usage(0);

	const handle = get('--handle');
	const appPassword = get('--password');
	const dir = get('--dir');
	const dryRun = has('--dry-run');
	const allowDaily = has('--allow-daily');

	if (!dir) {
		console.error('Error: --dir is required.\n');
		usage();
	}

	if (!dryRun && (!handle || !appPassword)) {
		console.error('Error: --handle and --password are required (unless --dry-run).\n');
		usage();
	}

	return {
		handle: handle ?? '',
		appPassword: appPassword ?? '',
		dir,
		dryRun,
		allowDaily
	};
}

// ── helpers ─────────────────────────────────────────────────────────────────
function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function validatePuzzle(data: unknown, filename: string): FoursPuzzle {
	if (!data || typeof data !== 'object' || !('groups' in data)) {
		throw new Error(`${filename}: missing "groups" field`);
	}
	const puzzle = data as { groups: unknown[] };
	if (!Array.isArray(puzzle.groups) || puzzle.groups.length !== 4) {
		throw new Error(`${filename}: must have exactly 4 groups`);
	}
	for (let i = 0; i < 4; i++) {
		const g = puzzle.groups[i] as FoursGroup;
		if (!g.category || typeof g.category !== 'string') {
			throw new Error(`${filename}: group ${i + 1} missing category`);
		}
		if (!Array.isArray(g.words) || g.words.length !== 4) {
			throw new Error(`${filename}: group ${i + 1} must have exactly 4 words`);
		}
		if (typeof g.difficulty !== 'number' || g.difficulty < 0 || g.difficulty > 3) {
			throw new Error(`${filename}: group ${i + 1} difficulty must be 0-3`);
		}
	}
	const allWords = puzzle.groups.flatMap((g) => g.words.map((w) => w.toUpperCase()));
	const seen = new Set<string>();
	for (const w of allWords) {
		if (seen.has(w)) {
			throw new Error(`${filename}: duplicate word "${w}"`);
		}
		seen.add(w);
	}
	return data as FoursPuzzle;
}

function loadPuzzles(dir: string): { filename: string; puzzle: FoursPuzzle }[] {
	const puzzles: { filename: string; puzzle: FoursPuzzle }[] = [];
	let i = 1;
	while (true) {
		const filepath = resolve(dir, `${i}.json`);
		if (!existsSync(filepath)) break;
		const raw = JSON.parse(readFileSync(filepath, 'utf-8'));
		const puzzle = validatePuzzle(raw, `${i}.json`);
		puzzles.push({ filename: `${i}.json`, puzzle });
		i++;
	}
	return puzzles;
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
	const config = parseArgs();

	// load & validate all puzzles first
	console.log(`Loading puzzles from: ${config.dir}`);
	const puzzles = loadPuzzles(config.dir);

	if (puzzles.length === 0) {
		console.error('No puzzle files found (expected 1.json, 2.json, ...)');
		process.exit(1);
	}

	console.log(`Found ${puzzles.length} valid puzzles`);

	if (config.dryRun) {
		console.log('Dry run — all puzzles validated successfully');
		for (const { filename, puzzle } of puzzles) {
			const categories = puzzle.groups.map((g) => g.category).join(', ');
			console.log(`  ${filename}: ${categories}`);
		}
		return;
	}

	// authenticate
	console.log(`Logging in as ${config.handle}...`);
	const session = await PasswordSession.login({
		service: 'https://bsky.social',
		identifier: config.handle,
		password: config.appPassword
	});
	const did = session.did;
	console.log(`Authenticated as ${did}`);

	const client = new Client({ handler: session });

	// publish each puzzle
	const uris: string[] = [];

	for (let i = 0; i < puzzles.length; i++) {
		const { filename, puzzle } = puzzles[i];
		const rkey = createTID();

		const record = {
			...puzzle,
			createdAt: new Date().toISOString(),
			allowDaily: config.allowDaily
		};

		try {
			await client.post('com.atproto.repo.putRecord', {
				input: {
					repo: did,
					collection: 'games.atmo.fours.puzzle',
					rkey,
					record
				}
			});

			const uri = `at://${did}/games.atmo.fours.puzzle/${rkey}`;
			uris.push(uri);
			console.log(`[${i + 1}/${puzzles.length}] Published ${filename} → ${rkey}`);
		} catch (err) {
			console.error(`[${i + 1}/${puzzles.length}] Failed to publish ${filename}:`, err);
			process.exit(1);
		}

		// small delay between creates to avoid rate limits
		if (i < puzzles.length - 1) {
			await sleep(100);
		}
	}

	// update puzzle list
	console.log('\nUpdating puzzle list...');

	let existingPuzzles: string[] = [];
	try {
		const resp = await client.get('com.atproto.repo.getRecord', {
			params: {
				repo: did,
				collection: 'games.atmo.fours.puzzleList',
				rkey: 'self'
			}
		});
		const value = resp.data.value;
		if (value && Array.isArray(value.puzzles)) {
			existingPuzzles = value.puzzles;
		}
	} catch {
		// no existing list
	}

	const allPuzzles = [...existingPuzzles, ...uris];

	await client.post('com.atproto.repo.putRecord', {
		input: {
			repo: did,
			collection: 'games.atmo.fours.puzzleList',
			rkey: 'self',
			record: { puzzles: allPuzzles }
		}
	});

	console.log(
		`Puzzle list updated: ${existingPuzzles.length} existing + ${uris.length} new = ${allPuzzles.length} total`
	);
	console.log('Done!');
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
