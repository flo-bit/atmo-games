<script lang="ts">
	import { cn } from '@foxui/core';
	import type { Snippet } from 'svelte';

	let {
		href,
		label,
		active = false,
		onclick,
		children
	}: {
		href?: string;
		label: string;
		active?: boolean;
		onclick?: () => void;
		children: Snippet;
	} = $props();

	let styles = $derived(
		cn(
			'group relative flex size-10 items-center justify-center rounded-lg border shadow-lg backdrop-blur-md transition-colors',
			active
				? 'border-accent-300/60 bg-accent-100/70 text-accent-700 dark:border-accent-800/50 dark:bg-accent-950/40 dark:text-accent-300'
				: 'border-base-200/70 bg-base-50/80 text-base-700 hover:bg-base-100 hover:text-base-950 dark:border-base-800/70 dark:bg-base-950/60 dark:text-base-200 dark:hover:bg-base-900/80 dark:hover:text-white'
		)
	);
</script>

{#snippet content()}
	{@render children()}
	<span class="sr-only">{label}</span>
	<span
		class="bg-base-900 pointer-events-none absolute left-14 rounded-lg px-3 py-2 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
	>
		{label}
	</span>
{/snippet}

{#if href}
	<a {href} class={styles} aria-current={active ? 'page' : undefined}>
		{@render content()}
	</a>
{:else}
	<button type="button" {onclick} class={styles}>
		{@render content()}
	</button>
{/if}
