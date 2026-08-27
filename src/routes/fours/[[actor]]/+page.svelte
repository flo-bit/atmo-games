<script lang="ts">
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import { cubicIn } from 'svelte/easing';
	import { Avatar, Button } from '@foxui/core';
	import FoursPlayPage from '$lib/fours/FoursPlayPage.svelte';

	let showOverlay = $state(true);

	let isMainDaily = $derived(page.data.isMainDaily as boolean);
	let isToday = $derived(page.data.isToday as boolean);
	let todayRkey = $derived(page.data.todayRkey as string | null);
	let handle = $derived(page.data.handle as string);
	let avatar = $derived(page.data.avatar as string | undefined);
	let feedHandle = $derived(page.data.feedHandle as string);
	let feedAvatar = $derived(page.data.feedAvatar as string | undefined);
	let puzzleIndex = $derived(page.data.puzzleIndex as number);
	let puzzleCount = $derived(page.data.puzzleCount as number);
</script>

{#if showOverlay && isMainDaily && isToday}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-base-50 dark:bg-base-950"
		out:fly={{ y: -window.innerHeight, duration: 150, opacity: 1, easing: cubicIn }}
	>
		<div class="flex flex-col items-center gap-16">
			<h1 class="text-4xl font-bold text-base-800 dark:text-base-200">Fours</h1>
			<div class="flex w-48 flex-col gap-3">
				<Button size="lg" class="w-full" onclick={() => (showOverlay = false)}>Play daily</Button>
				<Button size="lg" variant="secondary" class="w-full" href="/fours/create">Create puzzle</Button>
			</div>
		</div>
	</div>
{/if}

{#if !isToday && todayRkey}
	<div class="fixed top-4 right-4 z-40">
		<Button size="sm" variant="secondary" href="?">Play today's puzzle</Button>
	</div>
{/if}

<FoursPlayPage>
	{#snippet header()}
		{#if isMainDaily}
			<h1 class="text-2xl font-bold text-base-800 dark:text-base-200">Fours</h1>
			<span class="mt-1 text-xs text-base-400 dark:text-base-500">
				{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
			</span>
			<span class="mt-1 flex items-center gap-1 text-xs text-base-400 dark:text-base-500">
				by <Avatar src={avatar} alt={handle} class="size-4" /> {handle}
			</span>
		{:else}
			<h1 class="flex items-center gap-2 text-2xl font-bold text-base-800 dark:text-base-200">
				Fours by <Avatar src={feedAvatar} alt={feedHandle} class="size-8" /> {feedHandle}
			</h1>
			<span class="mt-1 text-xs text-base-400 dark:text-base-500">
				puzzle {puzzleIndex}/{puzzleCount} &middot; {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
			</span>
			{#if handle !== feedHandle}
				<span class="mt-1 flex items-center gap-1 text-xs text-base-400 dark:text-base-500">
					puzzle by <Avatar src={avatar} alt={handle} class="size-4" /> {handle}
				</span>
			{/if}
		{/if}
	{/snippet}
</FoursPlayPage>
