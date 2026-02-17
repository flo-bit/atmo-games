<script lang="ts">
	import '../app.css';

	import { onMount } from 'svelte';
	import { initClient } from '$lib/atproto';
	import LoginModal from '$lib/atproto/UI/LoginModal.svelte';
	import { ThemeToggle } from '@foxui/core';

	let { children } = $props();

	onMount(() => {
		initClient();
	});
</script>

{@render children()}

<LoginModal />

<ThemeToggle class="absolute top-4 left-4" />
