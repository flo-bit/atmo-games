<script lang="ts">
	import { Avatar } from '@foxui/core';

	let {
		date,
		handle,
		avatar
	}: {
		date: string;
		handle: string;
		avatar?: string;
	} = $props();

	let formattedDate = $derived(
		new Date(date).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		})
	);
</script>

<h1 class="text-base-800 dark:text-base-200 text-left text-2xl font-bold">
	Find four groups of four
</h1>
<div class="text-base-400 dark:text-base-500 mt-1 flex items-center gap-1.5 text-xs">
	<span>{formattedDate}</span>
	<span aria-hidden="true">&middot;</span>
	<span class="flex items-center gap-1">
		by <Avatar src={avatar} alt={handle} class="size-4" />
		{handle}
	</span>
</div>
