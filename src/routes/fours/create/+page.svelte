<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button, Checkbox, Label } from '@foxui/core';
	import { atProtoLoginModalState } from '@foxui/social';
	import { user } from '$lib/atproto';
	import type { FoursPuzzle } from '$lib/fours/types';
	import { submitPuzzle } from '$lib/fours/submit';

	const STORAGE_KEY = 'fours-draft';

	const groupColors = [
		'bg-yellow-400 dark:bg-yellow-600',
		'bg-green-400 dark:bg-green-600',
		'bg-blue-400 dark:bg-blue-600',
		'bg-purple-400 dark:bg-purple-600'
	] as const;

	const groupLabels = ['Easy', 'Medium', 'Hard', 'Tricky'] as const;

	let categories = $state(['', '', '', '']);
	let words = $state([
		['', '', '', ''],
		['', '', '', ''],
		['', '', '', ''],
		['', '', '', '']
	]);
	let error = $state('');
	let submitting = $state(false);
	let allowDaily = $state(false);
	let successRkey = $state('');

	let allFilled = $derived(
		categories.every((c) => c.trim() !== '') && words.every((row) => row.every((w) => w.trim() !== ''))
	);

	onMount(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const data = JSON.parse(saved);
				if (data.categories) categories = data.categories;
				if (data.words) words = data.words;
			}
		} catch { /* ignored */ }
	});

	function saveDraft() {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories, words }));
	}

	function clearDraft() {
		categories = ['', '', '', ''];
		words = [
			['', '', '', ''],
			['', '', '', ''],
			['', '', '', ''],
			['', '', '', '']
		];
		error = '';
		successRkey = '';
		localStorage.removeItem(STORAGE_KEY);
	}

	$effect(() => {
		categories.forEach(() => {});
		words.forEach((row) => row.forEach(() => {}));
		saveDraft();
	});

	function validate(): boolean {
		for (let i = 0; i < 4; i++) {
			if (categories[i].trim() === '') {
				error = `Group ${i + 1} category cannot be empty`;
				return false;
			}
			for (let j = 0; j < 4; j++) {
				if (words[i][j].trim() === '') {
					error = `Group ${i + 1}, word ${j + 1} cannot be empty`;
					return false;
				}
			}
		}
		const allWords = words.flat().map((w) => w.trim().toUpperCase());
		// eslint-disable-next-line svelte/require-svelte-set -- not reactive, just local validation
		const seen = new Set<string>();
		for (const w of allWords) {
			if (seen.has(w)) {
				error = `Duplicate word: "${w}"`;
				return false;
			}
			seen.add(w);
		}
		return true;
	}

	async function handleSubmit() {
		error = '';
		successRkey = '';

		if (!validate()) return;

		submitting = true;

		try {
			const puzzle: FoursPuzzle = {
				groups: [0, 1, 2, 3].map((i) => ({
					category: categories[i].trim(),
					words: [
						words[i][0].trim().toUpperCase(),
						words[i][1].trim().toUpperCase(),
						words[i][2].trim().toUpperCase(),
						words[i][3].trim().toUpperCase()
					] as [string, string, string, string],
					difficulty: i as 0 | 1 | 2 | 3
				})) as FoursPuzzle['groups']
			};

			const rkey = await submitPuzzle(puzzle, { allowDaily });
			clearDraft();
			goto(`/fours/${user.did}/p/${rkey}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to submit puzzle';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex min-h-svh flex-col items-center justify-center p-4">
	<h1 class="mb-6 text-2xl font-bold text-base-800 dark:text-base-200">Create Puzzle</h1>

	{#if !user.isLoggedIn}
		<div class="flex flex-col items-center gap-6 rounded-2xl bg-base-100 p-8 dark:bg-base-800">
			<p class="text-lg font-medium text-base-700 dark:text-base-300">
				Sign in with your Bluesky account to create puzzles
			</p>
			<Button onclick={() => atProtoLoginModalState.show()}>Sign In</Button>
		</div>
	{:else}
		<div class="board w-full max-w-lg">
			<div class="grid grid-cols-4 gap-2">
				{#each [0, 1, 2, 3] as i (i)}
					<div
						class="col-span-4 flex aspect-8/1 items-center justify-center rounded-lg {groupColors[i]}"
					>
						<input
							type="text"
							placeholder="{groupLabels[i]} category"
							bind:value={categories[i]}
							disabled={submitting}
							class="w-full bg-transparent text-center text-base font-extrabold text-base-900 placeholder-base-900/40 outline-none border-none ring-0 dark:text-base-100 dark:placeholder-base-100/40 sm:text-2xl"
						/>
					</div>
					{#each [0, 1, 2, 3] as j (j)}
						<div
							class="flex aspect-2/1 items-center justify-center rounded-lg {groupColors[i]}"
						>
							<input
								type="text"
								placeholder="Word {j + 1}"
								bind:value={words[i][j]}
								disabled={submitting}
								class="w-full bg-transparent text-center text-sm font-extrabold uppercase text-base-900 placeholder-base-900/40 outline-none border-none ring-0 dark:text-base-100 dark:placeholder-base-100/40 sm:text-lg"
							/>
						</div>
					{/each}
				{/each}
			</div>

			{#if error}
				<p class="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
			{/if}

			{#if successRkey}
				<div
					class="mt-4 rounded-md border border-green-300 bg-green-50 p-4 text-center dark:border-green-700 dark:bg-green-900/30"
				>
					<p class="text-sm font-medium text-green-800 dark:text-green-300">
						Puzzle created!
					</p>
					<a
						href="/fours/{user.did}/p/{successRkey}"
						class="mt-1 inline-block text-sm text-green-700 underline hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
					>
						View puzzle
					</a>
				</div>
			{/if}

			<div class="mt-4 flex items-center justify-center gap-2">
				<Checkbox id="allow-daily" bind:checked={allowDaily} disabled={submitting} aria-labelledby="allow-daily-label" />
				<Label id="allow-daily-label" for="allow-daily" class="text-sm text-base-600 dark:text-base-400">Allow my puzzle to be used as a daily puzzle</Label>
			</div>

			<div class="mt-4 flex items-center justify-center gap-3">
				<Button variant="secondary" onclick={clearDraft} disabled={submitting}>Clear</Button>
				<Button onclick={handleSubmit} disabled={submitting || !allFilled}>
					{#if submitting}
						Creating...
					{:else}
						Create Puzzle
					{/if}
				</Button>
			</div>
		</div>
	{/if}
</div>

<style>
	.board {
		container-type: inline-size;
	}

</style>
