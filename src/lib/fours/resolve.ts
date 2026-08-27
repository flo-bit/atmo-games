import { rpc, ok, avatarUrl, toActor } from './contrail';

export const DEFAULT_HANDLE = 'atmo.games';

export async function resolveActor(
	actor: string
): Promise<{ did: string; handle: string; avatar?: string }> {
	const data = await ok(
		rpc.get('games.atmo.getProfile', {
			params: { actor: toActor(actor) }
		})
	);
	const profile = data.profiles.find((entry) => entry.collection === 'app.bsky.actor.profile');
	if (!profile) throw new Error(`Profile not found: ${actor}`);

	return {
		did: profile.did,
		handle: profile.handle ?? actor,
		avatar: profile.value?.avatar ? avatarUrl(profile.did, profile.value.avatar) : undefined
	};
}
