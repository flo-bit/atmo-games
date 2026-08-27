import type { Did } from '@atcute/lexicons';
import { login, logout, signup } from '@svelte-atproto/oauth/client';
import { page } from '$app/state';

export const user = {
	get isLoggedIn() {
		return !!page.data?.did;
	},
	get did() {
		return (page.data?.did as Did | null) ?? null;
	}
};

export { login, logout, signup };
