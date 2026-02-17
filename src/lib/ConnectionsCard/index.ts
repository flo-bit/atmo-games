import type { CardDefinition, ContentComponentProps } from '../../types';
import ConnectionsCard from './ConnectionsCard.svelte';
import type { Component } from 'svelte';

export const ConnectionsCardDefinition = {
	type: 'connections',
	contentComponent: ConnectionsCard as unknown as Component<ContentComponentProps>,
	allowSetColor: true,
	createNew: (card) => {
		card.w = 4;
		card.h = 5;
		card.mobileW = 8;
		card.mobileH = 8;
		card.cardData = {};
	},
	minW: 3,
	minH: 4,
	canHaveLabel: true,

	keywords: ['connections', 'nyt', 'word', 'puzzle', 'game', 'fun', 'groups'],
	groups: ['Games'],

	name: 'Connections',
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg>`
} as CardDefinition & { type: 'connections' };
