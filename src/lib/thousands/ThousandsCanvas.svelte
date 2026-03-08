<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PALETTE, PALETTE_RGB } from './palette';
	import { JetstreamClient } from './jetstream';

	const W = 1000;
	const H = 1000;
	const MIN_SCALE = 0.3;
	const MAX_SCALE = 50;
	const GRID_MIN_SCALE = 8;
	const TOUCH_DRAG_THRESHOLD = 10;
	const MOUSE_DRAG_THRESHOLD = 2;

	interface Props {
		canvas: Uint8Array | null;
		cursor: number;
	}

	let { canvas: initialCanvas, cursor: initialCursor }: Props = $props();

	// UI state
	let connected = $state(false);
	let loaded = $state(false);

	// Pixel info on click
	let pixelAuthor: string | null = $state(null);
	const pixelOwners = new Map<string, string>();

	// DOM
	let containerEl: HTMLDivElement;
	let canvasEl: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	// Offscreen pixel buffer
	let offCanvas: HTMLCanvasElement;
	let offCtx: CanvasRenderingContext2D;
	let imgData: ImageData;

	// Pixel storage — 1 byte per pixel (color index 0-31), default white (0)
	const pixels = new Uint8Array(W * H);

	// Camera
	let scale = 1;
	let ox = 0;
	let oy = 0;

	// Drag
	let dragging = false;
	let dragged = false;
	let dsx = 0;
	let dsy = 0;
	let dox = 0;
	let doy = 0;
	let isTouch = false;

	// Pinch
	let pinchDist = 0;

	// Render batching
	let rafId = 0;

	let resizeObs: ResizeObserver;
	let jetstream: JetstreamClient;

	/* ------------------------------------------------------------------ */
	/*  Pixel info                                                         */
	/* ------------------------------------------------------------------ */

	async function fetchPixelAuthor(x: number, y: number) {
		pixelAuthor = null;
		try {
			let did = pixelOwners.get(`${x},${y}`);
			if (!did) {
				const { getPixelInfo } = await import('./pixel.remote');
				const info = await getPixelInfo({ x, y });
				did = info?.did ?? null;
			}
			if (!did) return;
			try {
				const cacheKey = `thousands-profile-${did}`;
				const cached = localStorage.getItem(cacheKey);
				if (cached) {
					pixelAuthor = cached;
				} else {
					const profile = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`);
					const handle = profile.ok ? `@${(await profile.json()).handle}` : did.slice(0, 16) + '\u2026';
					pixelAuthor = handle;
					try { localStorage.setItem(cacheKey, handle); } catch {}
				}
			} catch {
				pixelAuthor = did.slice(0, 16) + '\u2026';
			}
		} catch { /* offline */ }
	}

	/* ------------------------------------------------------------------ */
	/*  Rendering                                                          */
	/* ------------------------------------------------------------------ */

	let saveViewTimer: ReturnType<typeof setTimeout> | null = null;
	function saveView() {
		if (saveViewTimer) clearTimeout(saveViewTimer);
		saveViewTimer = setTimeout(() => {
			try { localStorage.setItem('thousands:view', JSON.stringify({ ox, oy, scale })); } catch {}
		}, 200);
	}

	function scheduleRender() {
		if (!rafId) rafId = requestAnimationFrame(render);
		saveView();
	}

	function render() {
		rafId = 0;
		if (!ctx || !offCanvas) return;

		const dpr = devicePixelRatio;
		const cw = canvasEl.width;
		const ch = canvasEl.height;

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, cw, ch);

		ctx.imageSmoothingEnabled = false;
		ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
		ctx.drawImage(offCanvas, 0, 0);

		// Grid lines at high zoom
		if (scale >= GRID_MIN_SCALE) {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.strokeStyle = 'rgba(0,0,0,0.12)';
			ctx.lineWidth = 1;

			const x0 = Math.max(0, Math.floor(-ox / scale));
			const y0 = Math.max(0, Math.floor(-oy / scale));
			const x1 = Math.min(W, Math.ceil((cw / dpr - ox) / scale));
			const y1 = Math.min(H, Math.ceil((ch / dpr - oy) / scale));

			ctx.beginPath();
			for (let x = x0; x <= x1; x++) {
				const sx = (x * scale + ox) * dpr;
				ctx.moveTo(sx, Math.max(0, (y0 * scale + oy) * dpr));
				ctx.lineTo(sx, Math.min(ch, (y1 * scale + oy) * dpr));
			}
			for (let y = y0; y <= y1; y++) {
				const sy = (y * scale + oy) * dpr;
				ctx.moveTo(Math.max(0, (x0 * scale + ox) * dpr), sy);
				ctx.lineTo(Math.min(cw, (x1 * scale + ox) * dpr), sy);
			}
			ctx.stroke();
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Pixel data                                                         */
	/* ------------------------------------------------------------------ */

	function rebuildImage() {
		imgData = new ImageData(W, H);
		const d = imgData.data;
		for (let i = 0; i < W * H; i++) {
			const [r, g, b] = PALETTE_RGB[pixels[i]] ?? [255, 255, 255];
			const j = i * 4;
			d[j] = r; d[j + 1] = g; d[j + 2] = b; d[j + 3] = 255;
		}
		offCtx.putImageData(imgData, 0, 0);
	}

	function setPixel(x: number, y: number, c: number) {
		if (x < 0 || x >= W || y < 0 || y >= H) return;
		if (c < 0 || c >= PALETTE.length) return;
		pixels[y * W + x] = c;
		const [r, g, b] = PALETTE_RGB[c];
		const j = (y * W + x) * 4;
		imgData.data[j] = r; imgData.data[j + 1] = g; imgData.data[j + 2] = b;
		offCtx.putImageData(imgData, 0, 0, x, y, 1, 1);
		scheduleRender();
	}

	/* ------------------------------------------------------------------ */
	/*  Coordinate helpers                                                 */
	/* ------------------------------------------------------------------ */

	function toCanvas(sx: number, sy: number): [number, number] {
		const r = canvasEl.getBoundingClientRect();
		return [Math.floor((sx - r.left - ox) / scale), Math.floor((sy - r.top - oy) / scale)];
	}

	function zoomAt(sx: number, sy: number, next: number) {
		const r = canvasEl.getBoundingClientRect();
		const mx = sx - r.left;
		const my = sy - r.top;
		const cx = (mx - ox) / scale;
		const cy = (my - oy) / scale;
		scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
		ox = mx - cx * scale;
		oy = my - cy * scale;
		scheduleRender();
	}

	function centerCanvas() {
		const cw = containerEl.clientWidth;
		const ch = containerEl.clientHeight;
		scale = Math.min(cw / W, ch / H) * 0.9;
		ox = (cw - W * scale) / 2;
		oy = (ch - H * scale) / 2;
	}

	/* ------------------------------------------------------------------ */
	/*  Mouse events                                                       */
	/* ------------------------------------------------------------------ */

	function onMouseDown(e: MouseEvent) {
		if (e.button !== 0 || isTouch) return;
		dragging = true;
		dragged = false;
		dsx = e.clientX; dsy = e.clientY;
		dox = ox; doy = oy;
		window.addEventListener('mousemove', onWindowDrag);
		window.addEventListener('mouseup', onWindowDragEnd);
	}

	function onWindowDrag(e: MouseEvent) {
		const dx = e.clientX - dsx;
		const dy = e.clientY - dsy;
		if (Math.abs(dx) > MOUSE_DRAG_THRESHOLD || Math.abs(dy) > MOUSE_DRAG_THRESHOLD) dragged = true;
		ox = dox + dx; oy = doy + dy;
		scheduleRender();
	}

	function onWindowDragEnd(e: MouseEvent) {
		window.removeEventListener('mousemove', onWindowDrag);
		window.removeEventListener('mouseup', onWindowDragEnd);
		if (dragging && !dragged) {
			const [cx, cy] = toCanvas(e.clientX, e.clientY);
			if (cx >= 0 && cx < W && cy >= 0 && cy < H) fetchPixelAuthor(cx, cy);
		}
		dragging = false;
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		zoomAt(e.clientX, e.clientY, scale * (e.deltaY > 0 ? 0.9 : 1.1));
	}

	/* ------------------------------------------------------------------ */
	/*  Touch events                                                       */
	/* ------------------------------------------------------------------ */

	function onTouchStart(e: TouchEvent) {
		isTouch = true;
		if (e.touches.length === 1) {
			dragging = true; dragged = false;
			dsx = e.touches[0].clientX; dsy = e.touches[0].clientY;
			dox = ox; doy = oy;
		} else if (e.touches.length === 2) {
			dragging = false;
			pinchDist = Math.hypot(
				e.touches[1].clientX - e.touches[0].clientX,
				e.touches[1].clientY - e.touches[0].clientY,
			);
		}
	}

	function onTouchMove(e: TouchEvent) {
		e.preventDefault();
		if (e.touches.length === 1 && dragging) {
			const dx = e.touches[0].clientX - dsx;
			const dy = e.touches[0].clientY - dsy;
			if (Math.abs(dx) > TOUCH_DRAG_THRESHOLD || Math.abs(dy) > TOUCH_DRAG_THRESHOLD) dragged = true;
			ox = dox + dx; oy = doy + dy;
			scheduleRender();
		} else if (e.touches.length === 2) {
			const d = Math.hypot(
				e.touches[1].clientX - e.touches[0].clientX,
				e.touches[1].clientY - e.touches[0].clientY,
			);
			const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
			const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
			if (pinchDist > 0) zoomAt(mx, my, scale * (d / pinchDist));
			pinchDist = d;
		}
	}

	function onTouchEnd(e: TouchEvent) {
		if (e.touches.length === 0) {
			if (dragging && !dragged) {
				const [cx, cy] = toCanvas(dsx, dsy);
				if (cx >= 0 && cx < W && cy >= 0 && cy < H) fetchPixelAuthor(cx, cy);
			}
			dragging = false; pinchDist = 0;
			scheduleRender();
		} else if (e.touches.length === 1) {
			dragging = true; dragged = true;
			dsx = e.touches[0].clientX; dsy = e.touches[0].clientY;
			dox = ox; doy = oy; pinchDist = 0;
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Resize                                                             */
	/* ------------------------------------------------------------------ */

	function onResize() {
		const dpr = devicePixelRatio;
		const w = containerEl.clientWidth;
		const h = containerEl.clientHeight;
		canvasEl.width = w * dpr;
		canvasEl.height = h * dpr;
		canvasEl.style.width = w + 'px';
		canvasEl.style.height = h + 'px';
		scheduleRender();
	}

	/* ------------------------------------------------------------------ */
	/*  Keyboard                                                           */
	/* ------------------------------------------------------------------ */

	function onKey(e: KeyboardEvent) {
		if (e.key === '+' || e.key === '=') { scale = Math.min(MAX_SCALE, scale * 1.2); scheduleRender(); }
		else if (e.key === '-') { scale = Math.max(MIN_SCALE, scale / 1.2); scheduleRender(); }
		else if (e.key === '0') { centerCanvas(); scheduleRender(); }
	}

	/* ------------------------------------------------------------------ */
	/*  Lifecycle                                                          */
	/* ------------------------------------------------------------------ */

	onMount(() => {
		ctx = canvasEl.getContext('2d')!;
		offCanvas = document.createElement('canvas');
		offCanvas.width = W; offCanvas.height = H;
		offCtx = offCanvas.getContext('2d')!;

		onResize();

		try {
			const saved = localStorage.getItem('thousands:view');
			if (saved) { const v = JSON.parse(saved); scale = v.scale ?? 1; ox = v.ox ?? 0; oy = v.oy ?? 0; }
			else centerCanvas();
		} catch { centerCanvas(); }

		if (initialCanvas) pixels.set(initialCanvas.subarray(0, W * H));
		rebuildImage();
		scheduleRender();
		loaded = true;

		// Start Jetstream from 2 minutes ago to cover any gap since the canvas was last baked
		const cursor = (Date.now() - 2 * 60 * 1000) * 1000;
		jetstream = new JetstreamClient(cursor, (x, y, c, did) => {
			pixelOwners.set(`${x},${y}`, did);
			setPixel(x, y, c);
		});
		jetstream.onStatusChange = (s) => (connected = s);
		jetstream.connect();

		canvasEl.addEventListener('wheel', onWheel, { passive: false });
		canvasEl.addEventListener('touchmove', onTouchMove, { passive: false });
		resizeObs = new ResizeObserver(onResize);
		resizeObs.observe(containerEl);
		window.addEventListener('keydown', onKey);
	});

	onDestroy(() => {
		jetstream?.disconnect();
		resizeObs?.disconnect();
		if (rafId) cancelAnimationFrame(rafId);
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('mousemove', onWindowDrag);
			window.removeEventListener('mouseup', onWindowDragEnd);
		}
	});
</script>

<div
	class="fixed inset-0 select-none touch-none bg-base-200 dark:bg-base-900"
	bind:this={containerEl}
>
	<canvas
		bind:this={canvasEl}
		class="block"
		style="image-rendering: pixelated; cursor: crosshair;"
		onmousedown={onMouseDown}
		onmouseleave={() => { dragging = false; }}
		ontouchstart={onTouchStart}
		ontouchend={onTouchEnd}
	></canvas>

	{#if !loaded}
		<div class="absolute inset-0 flex items-center justify-center bg-base-200/80 dark:bg-base-900/80">
			<p class="text-lg text-base-600 dark:text-base-400">Loading canvas&hellip;</p>
		</div>
	{/if}

	<!-- Back link -->
	<a
		href="/"
		class="absolute left-2 top-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-colors hover:bg-black/80 sm:left-4 sm:top-4 sm:text-sm"
	>
		&larr; back
	</a>

	<!-- Connection status -->
	<div class="pointer-events-none absolute right-2 top-2 sm:right-4 sm:top-4">
		<span class="inline-block h-2 w-2 rounded-full {connected ? 'bg-green-400' : 'bg-red-400'}"></span>
	</div>

	<!-- Pixel author tooltip -->
	{#if pixelAuthor}
		<div class="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center">
			<span
				class="rounded-full bg-black/60 px-3 py-1 text-xs text-white/80 backdrop-blur-sm"
				onclick={() => (pixelAuthor = null)}
			>liked by {pixelAuthor}</span>
		</div>
	{/if}
</div>
