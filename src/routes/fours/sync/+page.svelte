<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '@foxui/core';
	import { user, putRecord } from '$lib/atproto';
	import { getAllLocalScores, deleteAllLocalScores, deleteScoreLocal } from '$lib/fours/scores/idb';
	import { getScoreBacklink } from '$lib/fours/scores/backlinks';
	import type { LocalScoreEntry } from '$lib/fours/scores/types';

	let unsyncedScores: LocalScoreEntry[] = $state([]);
	let loading = $state(true);
	let syncing = $state(false);
	let syncProgress = $state(0);
	let error = $state('');

	onMount(async () => {
		if (!user.isLoggedIn || !user.did) {
			goto('/fours');
			return;
		}

		try {
			const allScores = await getAllLocalScores();

			// Quick bail if nothing in IndexedDB
			if (allScores.length === 0) {
				goto('/fours');
				return;
			}

			// Show count immediately, then filter out already-synced ones
			unsyncedScores = allScores;
			loading = false;

			const unsynced: LocalScoreEntry[] = [];
			for (const entry of allScores) {
				const existing = await getScoreBacklink(entry.puzzleUri, user.did!);
				if (!existing) {
					unsynced.push(entry);
				}
			}

			if (unsynced.length === 0) {
				await deleteAllLocalScores();
				goto('/fours');
				return;
			}

			unsyncedScores = unsynced;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to check local scores';
			loading = false;
		}
	});

	async function handleSave() {
		error = '';
		syncing = true;
		syncProgress = 0;

		try {
			for (let i = 0; i < unsyncedScores.length; i++) {
				const entry = unsyncedScores[i];
				await putRecord({
					collection: 'games.atmo.fours.score',
					rkey: entry.rkey,
					record: entry.record
				});
				await deleteScoreLocal(entry.puzzleUri);
				syncProgress = i + 1;
			}

			goto('/fours');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to sync scores';
			syncing = false;
		}
	}

	async function handleSkip() {
		await deleteAllLocalScores();
		goto('/fours');
	}
</script>

<div class="flex min-h-svh flex-col items-center justify-center p-4">
	{#if loading}
		<p class="text-base-500 dark:text-base-400">Checking local scores...</p>
	{:else if unsyncedScores.length > 0}
		<div
			class="bg-base-100 dark:bg-base-800 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl p-8"
		>
			<h1 class="text-base-800 dark:text-base-200 text-xl font-bold">Sync Scores</h1>

			<p class="text-base-700 dark:text-base-300 text-center">
				You have {unsyncedScores.length} score{unsyncedScores.length === 1 ? '' : 's'} saved locally.
				Save {unsyncedScores.length === 1 ? 'it' : 'them'} to your account?
			</p>

			{#if syncing}
				<div class="w-full">
					<div class="bg-base-300 dark:bg-base-600 mb-2 h-2 w-full overflow-hidden rounded-full">
						<div
							class="bg-base-700 dark:bg-base-300 h-full rounded-full transition-all"
							style="width: {(syncProgress / unsyncedScores.length) * 100}%"
						></div>
					</div>
					<p class="text-base-500 dark:text-base-400 text-center text-sm">
						Syncing {syncProgress}/{unsyncedScores.length}...
					</p>
				</div>
			{/if}

			{#if error}
				<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
			{/if}

			{#if !syncing}
				<div class="flex gap-3">
					<Button onclick={handleSave}>Save to Account</Button>
					<Button variant="secondary" onclick={handleSkip}>Skip</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>
