import type { LayoutServerLoad } from './$types';
import { resolveActor } from '$lib/fours/resolve';

async function getViewerAvatar(did: string) {
	try {
		return (await resolveActor(did)).avatar;
	} catch {
		return undefined;
	}
}

export const load: LayoutServerLoad = async ({ locals }) => ({
	did: locals.did,
	avatarUrl: locals.did ? await getViewerAvatar(locals.did) : undefined
});
