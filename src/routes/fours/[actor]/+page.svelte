<script lang="ts">
	import { page } from '$app/state';
	import { Avatar } from '@foxui/core';
	let handle = $derived(page.data.handle as string);
	let avatar = $derived(page.data.avatar as string | undefined);
	let did = $derived(page.data.did as string);
	let puzzles = $derived(
		page.data.puzzles as { rkey: string; words: string[]; createdAt: string | null }[]
	);
</script>

<div class="flex min-h-svh flex-col items-center p-4 pt-12">
	<div class="mb-8 flex flex-col items-center">
		<h1 class="text-base-800 dark:text-base-200 flex items-center gap-2 text-2xl font-bold">
			Puzzles by <Avatar src={avatar} alt={handle} class="size-8" />
			{handle}
		</h1>
		<span class="text-base-400 dark:text-base-500 mt-1 text-sm">
			{puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''}
		</span>
	</div>

	<div class="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
		{#each puzzles as { rkey, words, createdAt }, i (rkey)}
			<a
				href="/fours/{did}/p/{rkey}"
				class="bg-base-100 hover:bg-base-200 dark:bg-base-800 dark:hover:bg-base-700 rounded-2xl p-5 transition-colors"
			>
				<div class="mb-3 flex items-baseline justify-between">
					<p class="text-base-700 dark:text-base-300 text-base font-semibold">
						Puzzle {i + 1}
					</p>
					{#if createdAt}
						<span class="text-base-400 dark:text-base-500 text-xs">
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
							class="bg-base-200 text-base-600 dark:bg-base-700 dark:text-base-300 rounded-md px-2 py-2 text-center text-xs"
						>
							{word}
						</span>
					{/each}
				</div>
			</a>
		{/each}
	</div>
</div>
