<script lang="ts">
	import { page } from '$app/state';
	import { Avatar } from '@foxui/core';
	import FoursPlayPage from '$lib/fours/FoursPlayPage.svelte';

	let handle = $derived(page.data.handle as string);
	let avatar = $derived(page.data.avatar as string | undefined);
</script>

<FoursPlayPage>
	{#snippet header()}
		<h1 class="text-base-800 dark:text-base-200 flex items-center gap-2 text-2xl font-bold">
			Fours by <Avatar src={avatar} alt={handle} class="size-8" />
			{handle}
		</h1>
	{/snippet}
</FoursPlayPage>
