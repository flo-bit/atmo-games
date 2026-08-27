<script lang="ts">
	import { page } from '$app/state';
	import { Avatar } from '@foxui/core';

	let handle = $derived(page.data.handle as string);
	let avatar = $derived(page.data.avatar as string | undefined);
	let puzzles = $derived(
		page.data.puzzles as { rkey: string; did: string; words: string[]; createdAt: string | null }[]
	);
</script>

<div class="flex min-h-svh flex-col items-center p-4 pt-12">
	<div class="mb-8 flex flex-col items-center">
		<h1 class="flex items-center gap-2 text-2xl font-bold text-base-800 dark:text-base-200">
			Puzzles by <Avatar src={avatar} alt={handle} class="size-8" /> {handle}
		</h1>
		<span class="mt-1 text-sm text-base-400 dark:text-base-500">
			{puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''}
		</span>
	</div>

	<div class="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
		{#each puzzles as { rkey, did, words, createdAt }, i (rkey)}
			<a
				href="/fours/{did}/p/{rkey}"
				class="rounded-2xl bg-base-100 p-5 transition-colors hover:bg-base-200 dark:bg-base-800 dark:hover:bg-base-700"
			>
				<div class="mb-3 flex items-baseline justify-between">
					<p class="text-base font-semibold text-base-700 dark:text-base-300">
						Puzzle {i + 1}
					</p>
					{#if createdAt}
						<span class="text-xs text-base-400 dark:text-base-500">
							{new Date(createdAt).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
						</span>
					{/if}
				</div>
				<div class="grid grid-cols-4 gap-1.5">
					{#each words as word (word)}
						<span
							class="rounded-md bg-base-200 px-2 py-2 text-center text-xs text-base-600 dark:bg-base-700 dark:text-base-300"
						>
							{word}
						</span>
					{/each}
				</div>
			</a>
		{/each}
	</div>
</div>
