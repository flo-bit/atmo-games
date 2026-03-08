import { getCanvas } from '$lib/server/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const kv = platform?.env?.PLACE_KV;

	const [canvasData, blockJson, whitelistJson] = await Promise.all([
		kv ? getCanvas(kv) : null,
		kv ? kv.get('block', 'text') : null,
		kv ? kv.get('whitelist', 'text') : null
	]);

	const cursor = canvasData?.cursor ?? 0;
	console.log('[thousands] load cursor:', cursor);

	return {
		canvas: canvasData ? new Uint8Array(canvasData.canvas) : null,
		cursor,
		blocked: blockJson ? (JSON.parse(blockJson) as string[]) : [],
		whitelisted: whitelistJson ? (JSON.parse(whitelistJson) as string[]) : []
	};
};
