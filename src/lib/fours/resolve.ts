import { rpc, ok, avatarUrl, toActor } from './contrail';

export const DEFAULT_HANDLE = 'atmo.games';

export async function resolveActor(
	actor: string
): Promise<{ did: string; handle: string; avatar?: string }> {
	const data = await ok(rpc.get('games.atmo.getProfile', {
		params: { actor: toActor(actor) }
	}));

	let avatar: string | undefined;
	if (data.record?.avatar) {
		avatar = avatarUrl(data.did, data.record.avatar as { ref: { $link: string } });
	}

	return {
		did: data.did,
		handle: data.handle ?? actor,
		avatar
	};
}
