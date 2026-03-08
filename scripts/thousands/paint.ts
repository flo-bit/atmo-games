#!/usr/bin/env npx tsx
import type {} from '@atcute/atproto';
import sharp from 'sharp';
import { Client, CredentialManager } from '@atcute/client';
import * as TID from '@atcute/tid';
import * as colorDiff from 'color-diff';

// ── palette (matches src/lib/place/palette.ts) ──────────────────────────────
const PALETTE_HEX = [
	'#FFFFFF', '#D4D7D9', '#898D90', '#515252',
	'#000000', '#FFB470', '#9C6926', '#6D482F',
	'#FF99AA', '#FF3881', '#DE107F', '#E4ABFF',
	'#B44AC0', '#811E9F', '#94B3FF', '#6A5CFF',
	'#493AC1', '#51E9F4', '#3690EA', '#2450A4',
	'#00CCC0', '#009EAA', '#00756F', '#7EED56',
	'#00CC78', '#00A368', '#FFF8B8', '#FFD635',
	'#FFA800', '#FF4500', '#BE0039', '#6D001A',
] as const;

const PALETTE_RGB = PALETTE_HEX.map((hex) => {
	const n = parseInt(hex.slice(1), 16);
	return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff] as [number, number, number];
});

const PALETTE_DIFF = PALETTE_RGB.map(([R, G, B], i) => ({ R, G, B, index: i }));

function closestColor(r: number, g: number, b: number): number {
	const match = colorDiff.closest({ R: r, G: g, B: b }, PALETTE_DIFF);
	return (match as any).index as number;
}

// ── config ──────────────────────────────────────────────────────────────────
interface Config {
	handle: string;
	appPassword: string;
	imagePath: string;
	startX: number;
	startY: number;
	maxWidth: number;
	maxHeight: number;
	intervalSeconds: number;
	/** skip white (palette 0) pixels — useful on a blank canvas */
	skipWhite: boolean;
	/** randomize pixel placement order */
	shuffle: boolean;
	/** just convert the image and write a preview file, don't paint */
	dryRun: boolean;
	/** skip the first N pixels before painting */
	skip: number;
}

function usage(): never {
	console.log(`
Usage: npx tsx scripts/thousands/paint.ts [options]

Required:
  --handle       Bluesky handle (e.g. alice.bsky.social)
  --password     App password
  --image        Path to image file

Optional:
  --x            Canvas X offset (default: 0)
  --y            Canvas Y offset (default: 0)
  --max-width    Max image width after resize (default: 64)
  --max-height   Max image height after resize (default: 64)
  --interval     Seconds between pixel placements (default: 60)
  --skip-white   Skip white pixels (default: false)
  --shuffle      Randomize pixel order (default: false)
  --dry-run      Convert image and save preview, don't paint
  --skip         Skip the first N pixels (default: 0)
  --help         Show this help
`);
	process.exit(1);
}

function parseArgs(): Config {
	const args = process.argv.slice(2);
	const get = (flag: string): string | undefined => {
		const i = args.indexOf(flag);
		return i !== -1 ? args[i + 1] : undefined;
	};
	const has = (flag: string) => args.includes(flag);

	if (has('--help') || has('-h')) usage();

	const handle = get('--handle');
	const appPassword = get('--password');
	const imagePath = get('--image');

	const dryRun = has('--dry-run');

	if (!imagePath) {
		console.error('Error: --image is required.\n');
		usage();
	}

	if (!dryRun && (!handle || !appPassword)) {
		console.error('Error: --handle and --password are required (unless --dry-run).\n');
		usage();
	}

	return {
		handle: handle ?? '',
		appPassword: appPassword ?? '',
		imagePath,
		startX: parseInt(get('--x') ?? '0', 10),
		startY: parseInt(get('--y') ?? '0', 10),
		maxWidth: parseInt(get('--max-width') ?? '64', 10),
		maxHeight: parseInt(get('--max-height') ?? '64', 10),
		intervalSeconds: parseFloat(get('--interval') ?? '60'),
		skipWhite: has('--skip-white'),
		shuffle: has('--shuffle'),
		dryRun,
		skip: parseInt(get('--skip') ?? '0', 10),
	};
}

// ── helpers ─────────────────────────────────────────────────────────────────
function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function shuffleArray<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

interface Pixel {
	x: number;
	y: number;
	color: number;
}

// ── image processing ────────────────────────────────────────────────────────
async function loadResized(config: Config) {
	const { data, info } = await sharp(config.imagePath)
		.resize(config.maxWidth, config.maxHeight, { fit: 'inside' })
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	return { data, width: info.width, height: info.height, channels: info.channels };
}

function extractPixels(
	data: Buffer,
	width: number,
	height: number,
	channels: number,
	config: Config,
): Pixel[] {
	const pixels: Pixel[] = [];
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * channels;
			const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

			if (a < 128) continue;

			const color = closestColor(r, g, b);
			if (config.skipWhite && color === 0) continue;

			const canvasX = config.startX + x;
			const canvasY = config.startY + y;
			if (canvasX < 0 || canvasX >= 1000 || canvasY < 0 || canvasY >= 1000) continue;

			pixels.push({ x: canvasX, y: canvasY, color });
		}
	}
	return pixels;
}

async function writePreview(
	data: Buffer,
	width: number,
	height: number,
	channels: number,
	outputPath: string,
) {
	// rebuild an RGBA buffer with every pixel snapped to the palette
	const out = Buffer.alloc(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const si = (y * width + x) * channels;
			const di = (y * width + x) * 4;
			const a = data[si + 3];
			if (a < 128) {
				// transparent stays transparent
				out[di] = 0; out[di + 1] = 0; out[di + 2] = 0; out[di + 3] = 0;
				continue;
			}
			const [r, g, b] = PALETTE_RGB[closestColor(data[si], data[si + 1], data[si + 2])];
			out[di] = r; out[di + 1] = g; out[di + 2] = b; out[di + 3] = 255;
		}
	}
	await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(outputPath);
	console.log(`Preview saved to ${outputPath}`);
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
	const config = parseArgs();

	// load & process image
	console.log(`Loading image: ${config.imagePath}`);
	const { data, width, height, channels } = await loadResized(config);
	const pixels = extractPixels(data, width, height, channels, config);
	console.log(`Image resized to ${width}×${height}, ${pixels.length} pixels to paint`);

	if (config.dryRun) {
		const ext = config.imagePath.lastIndexOf('.');
		const outputPath =
			(ext !== -1 ? config.imagePath.slice(0, ext) : config.imagePath) + '.preview.png';
		await writePreview(data, width, height, channels, outputPath);
		return;
	}

	if (pixels.length === 0) {
		console.log('Nothing to paint!');
		return;
	}

	if (config.shuffle) {
		shuffleArray(pixels);
		console.log('Pixel order shuffled');
	}

	const totalPixels = pixels.length;
	const startIndex = config.skip;

	if (startIndex > 0) {
		pixels.splice(0, startIndex);
		console.log(`Skipping first ${startIndex} pixels, ${pixels.length} remaining`);
	}

	const totalTime = pixels.length * config.intervalSeconds;
	console.log(`Estimated time: ${Math.round(totalTime / 60)} minutes (${config.intervalSeconds}s interval)`);

	// authenticate
	console.log(`Logging in as ${config.handle}...`);
	const manager = new CredentialManager({ service: 'https://bsky.social' });
	await manager.login({ identifier: config.handle, password: config.appPassword });
	const did = manager.session!.did;
	console.log(`Authenticated as ${did}`);

	const client = new Client({ handler: manager });

	// paint loop
	for (let i = 0; i < pixels.length; i++) {
		const { x, y, color } = pixels[i];
		const rkey = TID.now();
		const pixelNum = startIndex + i + 1;

		try {
			const resp = await client.post('com.atproto.repo.createRecord', {
				input: {
					repo: did as string,
					collection: 'games.atmo.thousands.pixel',
					rkey,
					record: { x, y, color },
				},
			} as any);

			if (resp.ok) {
				console.log(
					`[${pixelNum}/${totalPixels}] Placed pixel (${x}, ${y}) color=${color} (${PALETTE_HEX[color]})`
				);
			} else {
				console.error(`[${pixelNum}/${totalPixels}] Failed:`, resp.data);
			}
		} catch (err) {
			console.error(`[${pixelNum}/${totalPixels}] Error:`, err);
		}

		// wait before next pixel (skip wait after last)
		if (i < pixels.length - 1) {
			await sleep(config.intervalSeconds * 1000);
		}
	}

	console.log('Done! All pixels placed.');
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
