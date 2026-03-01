<script lang="ts">
	import '../app.css';

	import { ThemeToggle } from '@foxui/core';

	let { children } = $props();
</script>

{@render children()}

<ThemeToggle class="absolute top-4 left-4" />
