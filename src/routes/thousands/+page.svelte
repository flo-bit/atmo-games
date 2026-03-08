<script lang="ts">
	import PlaceCanvas from '$lib/place/PlaceCanvas.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Thousands</title>
	<meta property="og:title" content="Thousands" />
	<meta property="og:description" content="A collaborative pixel canvas by atmo.games" />
	<meta property="og:image" content="/thousands/og.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="/thousands/og.png" />
</svelte:head>

<PlaceCanvas canvas={data.canvas} cursor={data.cursor} />
