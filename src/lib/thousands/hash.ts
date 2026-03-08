/**
 * Deterministically hash a Bluesky like AT URI to a canvas pixel.
 * Uses FNV-1a 32-bit with additional mixing for independent x/y/color.
 */
export function hashLikeUri(did: string, rkey: string): { x: number; y: number; color: number } {
	const uri = `at://${did}/app.bsky.feed.like/${rkey}`;
	let h = 2166136261; // FNV-1a 32-bit offset basis
	for (let i = 0; i < uri.length; i++) {
		h ^= uri.charCodeAt(i);
		h = Math.imul(h, 16777619) >>> 0;
	}
	const x = h % 1000;
	h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) >>> 0;
	const y = h % 1000;
	h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) >>> 0;
	const color = h % 32;
	return { x, y, color };
}
