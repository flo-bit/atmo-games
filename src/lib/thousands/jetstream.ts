/**
 * Jetstream WebSocket client for real-time pixel updates.
 *
 * Connects to the AT Protocol Jetstream firehose, filters for
 * `app.bsky.feed.like` events, and maps each like to a pixel via hash.
 */

import { hashLikeUri } from './hash';

const JETSTREAM_URL = 'wss://jetstream1.us-east.bsky.network/subscribe';
const COLLECTION = 'app.bsky.feed.like';
const RECONNECT_MS = 3_000;

export type PixelHandler = (x: number, y: number, color: number, did: string, timeUs: number) => void;
export type StatusHandler = (connected: boolean) => void;

export class JetstreamClient {
	private ws: WebSocket | null = null;
	private cursor: number;
	private onPixel: PixelHandler;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private destroyed = false;

	onStatusChange: StatusHandler = () => {};

	constructor(cursor: number, onPixel: PixelHandler) {
		this.cursor = cursor;
		this.onPixel = onPixel;
	}

	connect() {
		if (this.destroyed) return;

		const url = new URL(JETSTREAM_URL);
		url.searchParams.set('wantedCollections', COLLECTION);
		if (this.cursor > 0) {
			url.searchParams.set('cursor', this.cursor.toString());
		}

		this.ws = new WebSocket(url);

		this.ws.onopen = () => {
			console.log('[jetstream] connected to', url.toString());
			this.onStatusChange(true);
		};

		this.ws.onmessage = (ev) => {
			try {
				const msg = JSON.parse(ev.data as string);
				if (msg.kind !== 'commit') return;

				const c = msg.commit;
				if (!c || c.collection !== COLLECTION || c.operation !== 'create') return;

				const { x, y, color } = hashLikeUri(msg.did as string, c.rkey as string);
				this.onPixel(x, y, color, msg.did as string, msg.time_us as number);
				this.cursor = msg.time_us as number;
			} catch (e) {
				console.warn('[jetstream] malformed message', e);
			}
		};

		this.ws.onclose = () => {
			this.onStatusChange(false);
			this.scheduleReconnect();
		};

		this.ws.onerror = () => {
			this.ws?.close();
		};
	}

	disconnect() {
		this.destroyed = true;
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
		this.ws?.close();
		this.ws = null;
	}

	private scheduleReconnect() {
		if (this.destroyed) return;
		this.reconnectTimer = setTimeout(() => this.connect(), RECONNECT_MS);
	}
}
