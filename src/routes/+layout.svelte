<script lang="ts">
	import '../app.css';

	import { ThemeToggle, Toaster } from '@foxui/core';
	import { AtprotoLoginModal } from '@foxui/social';
	import { login, signup } from '$lib/atproto';

	let { children } = $props();
</script>

{@render children()}

<Toaster />

<AtprotoLoginModal
	login={async (handle) => {
		await login(handle);
		return true;
	}}
	signup={async () => {
		signup();
		return true;
	}}
/>

<div class="fixed top-3 left-3 z-50">
	<ThemeToggle />
</div>
