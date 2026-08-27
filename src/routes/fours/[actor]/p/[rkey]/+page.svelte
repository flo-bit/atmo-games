<script lang="ts">
	import { page } from '$app/state';
	import FoursHeader from '$lib/fours/FoursHeader.svelte';
	import FoursPlayPage from '$lib/fours/FoursPlayPage.svelte';

	let date = $derived(page.data.date as string);
	let handle = $derived(page.data.handle as string);
	let avatar = $derived(page.data.avatar as string | undefined);
</script>

<FoursPlayPage>
	{#snippet header()}
		<FoursHeader {date} {handle} {avatar} />
	{/snippet}
</FoursPlayPage>
