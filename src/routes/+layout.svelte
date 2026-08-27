<script lang="ts">
	import '../app.css';

	import { ThemeToggle, Toaster } from '@foxui/core';
	import { AtprotoLoginModal } from '@foxui/social';
	import { login, signup } from '$lib/atproto';
	import { loginDialog } from '$lib/login.svelte';

	let { children } = $props();
</script>

{@render children()}

<Toaster />

<AtprotoLoginModal
	bind:open={loginDialog.open}
	login={async (handle) => {
		await login(handle);
		return true;
	}}
	signup={async () => {
		await signup();
		return true;
	}}
/>

<div class="fixed top-3 left-3 z-50">
	<ThemeToggle />
</div>
