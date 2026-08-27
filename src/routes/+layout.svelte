<script lang="ts">
	import '../app.css';

	import { Toaster } from '@foxui/core';
	import { AtprotoLoginModal } from '@foxui/social';
	import { login, signup } from '$lib/atproto';
	import { loginDialog } from '$lib/login.svelte';
	import AppMenu from '$lib/components/AppMenu.svelte';

	let { data, children } = $props();
</script>

{@render children()}

<AppMenu did={data.did} avatarUrl={data.avatarUrl} />
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
