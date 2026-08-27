import type { ContrailConfig } from '@atmo-dev/contrail';

export const config: ContrailConfig = {
	namespace: 'games.atmo',
	profiles: ['app.bsky.actor.profile'],
	jetstreams: ['wss://jetstream1.us-east.bsky.network'],
	orderedSource: {
		source: 'jetstream',
		epoch: 'api-atmo-games-primary-2026-08'
	},
	notify: true,
	serviceAuth: {
		audience: 'did:web:api.atmo.games#contrail',
		methods: ['notifyOfUpdate']
	},
	maintenance: { optimize: true },
	collections: {
		puzzle: {
			collection: 'games.atmo.fours.puzzle',
			queryable: {
				allowDaily: {},
				createdAt: { type: 'range' }
			},
			relations: {
				scores: {
					collection: 'score'
				}
			}
		},
		puzzleList: {
			collection: 'games.atmo.fours.puzzleList'
		},
		score: {
			collection: 'games.atmo.fours.score',
			queryable: {
				'puzzle.uri': {},
				state: {}
			},
			searchable: ['puzzle.uri', 'state'],
			references: {
				puzzle: {
					collection: 'puzzle',
					field: 'puzzle.uri'
				}
			}
		}
	}
};
