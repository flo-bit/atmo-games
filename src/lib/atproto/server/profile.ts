import type { Did } from '@atcute/lexicons';
import { rpc, ok, avatarUrl } from '$lib/fours/contrail';

const PROFILE_CACHE_TTL = 60 * 60; // 1 hour

export async function loadProfile(did: Did, profileCache?: KVNamespace) {
	if (profileCache) {
		try {
			const cached = await profileCache.get(did, 'json');
			if (cached) return cached as Record<string, unknown>;
		} catch {
			// Cache read failed, continue to fresh fetch
		}
	}

	const profile = await fetchProfile(did);

	if (profileCache && profile) {
		profileCache
			.put(did, JSON.stringify(profile), { expirationTtl: PROFILE_CACHE_TTL })
			.catch(() => {});
	}

	return profile;
}

async function fetchProfile(did: Did) {
	try {
		const data = await ok(rpc.get('games.atmo.getProfile', {
			params: { actor: did }
		}));

		let avatar: string | undefined;
		if (data.record?.avatar) {
			avatar = avatarUrl(data.did, data.record.avatar as { ref: { $link: string } });
		}

		return {
			did: data.did,
			handle: data.handle ?? 'handle.invalid',
			avatar
		};
	} catch (e) {
		console.error('Failed to load profile:', e);
		return undefined;
	}
}
