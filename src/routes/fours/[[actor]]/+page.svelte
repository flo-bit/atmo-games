<script lang="ts">
	import { page } from '$app/state';
	import { fly } from 'svelte/transition';
	import { cubicIn } from 'svelte/easing';
	import { Button } from '@foxui/core';
	import FoursHeader from '$lib/fours/FoursHeader.svelte';
	import FoursPlayPage from '$lib/fours/FoursPlayPage.svelte';

	let showOverlay = $state(true);

	let isMainDaily = $derived(page.data.isMainDaily as boolean);
	let isToday = $derived(page.data.isToday as boolean);
	let todayRkey = $derived(page.data.todayRkey as string | null);
	let date = $derived(page.data.date as string);
	let handle = $derived(page.data.handle as string);
	let avatar = $derived(page.data.avatar as string | undefined);
</script>

{#if showOverlay && isMainDaily && isToday}
	<div
		class="bg-base-50 dark:bg-base-950 fixed inset-0 z-50 flex items-center justify-center"
		out:fly={{ y: -window.innerHeight, duration: 150, opacity: 1, easing: cubicIn }}
	>
		<div class="flex flex-col items-center gap-16">
			<h1 class="text-base-800 dark:text-base-200 text-4xl font-bold">Fours</h1>
			<div class="flex w-48 flex-col gap-3">
				<Button size="lg" class="w-full" onclick={() => (showOverlay = false)}>Play daily</Button>
				<Button size="lg" variant="secondary" class="w-full" href="/fours/create"
					>Create puzzle</Button
				>
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
		<FoursHeader {date} {handle} {avatar} />
	{/snippet}
</FoursPlayPage>
