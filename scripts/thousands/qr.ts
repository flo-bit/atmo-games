#!/usr/bin/env npx tsx
import type {} from '@atcute/atproto';
import { Client, CredentialManager } from '@atcute/client';
import * as TID from '@atcute/tid';
import QRCode from 'qrcode';

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

// ── config ──────────────────────────────────────────────────────────────────
interface Config {
	handle: string;
	appPassword: string;
	text: string;
	startX: number;
	startY: number;
	scale: number;
	intervalSeconds: number;
	darkColor: number;
	lightColor: number;
	/** skip white (palette 0) pixels */
	skipWhite: boolean;
	/** randomize pixel placement order */
	shuffle: boolean;
	/** just write a preview, don't paint */
	dryRun: boolean;
	/** skip the first N pixels before painting */
	skip: number;
}

function usage(): never {
	console.log(`
Usage: npx tsx scripts/thousands/qr.ts [options]

Required:
  --handle       Bluesky handle (e.g. alice.bsky.social)
  --password     App password
  --text         Text or URL to encode as QR code

Optional:
  --x            Canvas X offset (default: 0)
  --y            Canvas Y offset (default: 0)
  --scale        Pixels per QR cell (default: 1)
  --interval     Seconds between pixel placements (default: 10)
  --dark         Palette index for dark cells (default: 4 = black)
  --light        Palette index for light cells (default: 0 = white)
  --skip-white   Skip white/light pixels (default: false)
  --shuffle      Randomize pixel order (default: false)
  --dry-run      Show preview info, don't paint
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

	const text = get('--text');
	const handle = get('--handle');
	const appPassword = get('--password');
	const dryRun = has('--dry-run');

	if (!text) {
		console.error('Error: --text is required.\n');
		usage();
	}

	if (!dryRun && (!handle || !appPassword)) {
		console.error('Error: --handle and --password are required (unless --dry-run).\n');
		usage();
	}

	return {
		handle: handle ?? '',
		appPassword: appPassword ?? '',
		text,
		startX: parseInt(get('--x') ?? '0', 10),
		startY: parseInt(get('--y') ?? '0', 10),
		scale: parseInt(get('--scale') ?? '1', 10),
		intervalSeconds: parseFloat(get('--interval') ?? '10'),
		darkColor: parseInt(get('--dark') ?? '4', 10),
		lightColor: parseInt(get('--light') ?? '0', 10),
		skipWhite: has('--skip-white'),
		shuffle: has('--shuffle'),
		dryRun,
		skip: parseInt(get('--skip') ?? '0', 10),
	};
}

// ── helpers ──────────────────────────────────────────────────────────────────
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

// ── QR generation ────────────────────────────────────────────────────────────
async function generatePixels(config: Config): Promise<{ pixels: Pixel[]; qrSize: number; canvasSize: number }> {
	const qr = QRCode.create(config.text, { errorCorrectionLevel: 'M' });
	const { data, size } = qr.modules;

	const canvasSize = size * config.scale;
	const pixels: Pixel[] = [];

	for (let cy = 0; cy < size; cy++) {
		for (let cx = 0; cx < size; cx++) {
			const dark = data[cy * size + cx] !== 0;
			const color = dark ? config.darkColor : config.lightColor;

			if (!dark && config.skipWhite) continue;

			for (let dy = 0; dy < config.scale; dy++) {
				for (let dx = 0; dx < config.scale; dx++) {
					const canvasX = config.startX + cx * config.scale + dx;
					const canvasY = config.startY + cy * config.scale + dy;
					if (canvasX < 0 || canvasX >= 1000 || canvasY < 0 || canvasY >= 1000) continue;
					pixels.push({ x: canvasX, y: canvasY, color });
				}
			}
		}
	}

	return { pixels, qrSize: size, canvasSize };
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
	const config = parseArgs();

	console.log(`Generating QR code for: ${config.text}`);
	const { pixels, qrSize, canvasSize } = await generatePixels(config);
	console.log(`QR code: ${qrSize}×${qrSize} cells, ${canvasSize}×${canvasSize} pixels at scale ${config.scale}`);
	console.log(`Total pixels: ${pixels.length}`);

	if (config.dryRun) {
		const pixelsAfterSkip = Math.max(0, pixels.length - config.skip);
		const totalTime = pixelsAfterSkip * config.intervalSeconds;
		const minutes = Math.floor(totalTime / 60);
		const hours = Math.floor(minutes / 60);
		const timeStr = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
		console.log(`Estimated time: ${timeStr} (${pixelsAfterSkip} pixels × ${config.intervalSeconds}s interval)`);

		// Rate-limit warnings (3 points per pixel create; 5000 pts/hr, 35000 pts/day)
		const PTS_PER_PIXEL = 3;
		const HOURLY_LIMIT = 5000;
		const DAILY_LIMIT = 35000;
		const maxPixelsPerHour = Math.floor(HOURLY_LIMIT / PTS_PER_PIXEL); // 1666
		const maxPixelsPerDay = Math.floor(DAILY_LIMIT / PTS_PER_PIXEL);   // 11666
		const pixelsPerHour = 3600 / config.intervalSeconds;

		if (pixelsAfterSkip * PTS_PER_PIXEL > HOURLY_LIMIT && pixelsPerHour > maxPixelsPerHour) {
			const minSafeInterval = Math.ceil((3600 * PTS_PER_PIXEL) / HOURLY_LIMIT);
			console.warn(`⚠️  Rate limit warning: at ${config.intervalSeconds}s interval you'd paint ~${Math.round(pixelsPerHour)} pixels/hr (${Math.round(pixelsPerHour * PTS_PER_PIXEL)} pts/hr), exceeding the hourly limit of ${HOURLY_LIMIT} pts/hr. Use --interval ${minSafeInterval} or higher.`);
		}
		if (pixelsAfterSkip > maxPixelsPerDay) {
			const days = Math.ceil(pixelsAfterSkip / maxPixelsPerDay);
			console.warn(`⚠️  Rate limit warning: ${pixelsAfterSkip} pixels (${pixelsAfterSkip * PTS_PER_PIXEL} pts) exceeds the daily limit of ${DAILY_LIMIT} pts/day (${maxPixelsPerDay} pixels). Will take at least ${days} days to complete.`);
		}

		console.log(`Canvas region: (${config.startX}, ${config.startY}) to (${config.startX + canvasSize - 1}, ${config.startY + canvasSize - 1})`);
		console.log(`Dark color: ${config.darkColor} (${PALETTE_HEX[config.darkColor]}), Light color: ${config.lightColor} (${PALETTE_HEX[config.lightColor]})`);
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
