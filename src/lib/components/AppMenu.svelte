<script lang="ts">
	import { page } from '$app/state';
	import { Avatar } from '@foxui/core';
	import { loginDialog } from '$lib/login.svelte';
	import MenuItem from './MenuItem.svelte';

	let { did, avatarUrl }: { did: string | null; avatarUrl?: string } = $props();

	let profileHref = $derived(did ? `/fours/${did}/puzzles` : undefined);
	let profileActive = $derived(!!did && page.url.pathname === profileHref);
</script>

<aside
	class="fixed top-2 bottom-2 left-0 z-40 hidden w-[4.5rem] py-2 md:block"
	aria-label="Main navigation"
>
	<nav class="flex h-full flex-col items-center gap-2">
		<MenuItem href="/" label="Home" active={page.url.pathname === '/'}>
			<svg
				class="size-5 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="m2.25 12 8.954-8.955a1.125 1.125 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125C4.5 20.496 5.004 21 5.625 21H9.75v-4.875C9.75 15.504 10.254 15 10.875 15h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
				/>
			</svg>
		</MenuItem>

		<div class="mt-auto">
			<MenuItem
				href={profileHref}
				label={did ? 'Profile' : 'Log in'}
				active={profileActive}
				onclick={() => loginDialog.show()}
			>
				{#if avatarUrl}
					<Avatar src={avatarUrl} alt="" class="size-7" />
				{:else}
					<svg
						class="size-5 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.12a7.5 7.5 0 0 1 15 0A17.9 17.9 0 0 1 12 21.75a17.9 17.9 0 0 1-7.5-1.63Z"
						/>
					</svg>
				{/if}
			</MenuItem>
		</div>
	</nav>
</aside>
