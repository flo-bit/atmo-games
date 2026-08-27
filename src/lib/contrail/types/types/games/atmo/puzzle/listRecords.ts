import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';
import * as AppBskyActorProfile from "../../../app/bsky/actor/profile.js";
import * as GamesAtmoFoursPuzzle from "../fours/puzzle.js";
import * as GamesAtmoFoursScore from "../fours/score.js";

const _hydrateScoresRecordSchema = /*#__PURE__*/ v.object(
	{
		"$type": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("games.atmo.puzzle.listRecords#hydrateScoresRecord")),
		"cid": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.cidString()),
		"collection": /*#__PURE__*/ v.nsidString(),
		"did": /*#__PURE__*/ v.didString(),
		"rkey": /*#__PURE__*/ v.string(),
		"time_us": /*#__PURE__*/ v.integer(),
		"uri": /*#__PURE__*/ v.resourceUriString(),
		get "value"() {
			return GamesAtmoFoursScore.mainSchema
		},
	}
);
const _mainSchema = /*#__PURE__*/ v.query(
	"games.atmo.puzzle.listRecords",
	{
		"params": /*#__PURE__*/ v.object(
			{
				/**
				 * Filter by an indexed DID or cached handle
				 */
				"actor": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.actorIdentifierString()),
				/**
				 * Filter by allowDaily
				 */
				"allowDaily": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
				/**
				 * Maximum value for createdAt
				 */
				"createdAtMax": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
				/**
				 * Minimum value for createdAt
				 */
				"createdAtMin": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
				"cursor": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
				/**
				 * Number of scores records to embed
				 * @minimum 1
				 * @maximum 50
				 */
				"hydrateScores": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.constrain(
					/*#__PURE__*/ v.integer(),
					[/*#__PURE__*/ v.integerRange(1, 50)]
				)),
				/**
				 * @minimum 1
				 * @maximum 200
				 * @default 50
				 */
				"limit": /*#__PURE__*/ v.optional(
					/*#__PURE__*/ v.constrain(
						/*#__PURE__*/ v.integer(),
						[/*#__PURE__*/ v.integerRange(1, 200)]
					),
					50
				),
				/**
				 * Sort direction
				 */
				"order": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string<"asc" | "desc" | (string & {})>()),
				/**
				 * Include indexed profile and identity information
				 */
				"profiles": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
				/**
				 * Minimum total scores count
				 */
				"scoresCountMin": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
				/**
				 * Field to sort by (default: time_us)
				 */
				"sort": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string<"allowDaily" | "createdAt" | "scoresCount" | (string & {})>()),
			}
		),
		"output": {
			"type": "lex",
			"schema": /*#__PURE__*/ v.object(
				{
					"cursor": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
					get "profiles"() {
						return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(profileEntrySchema))
					},
					get "records"() {
						return /*#__PURE__*/ v.array(recordSchema)
					},
				}
			),
		}
	}
);
const _profileEntrySchema = /*#__PURE__*/ v.object(
	{
		"$type": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("games.atmo.puzzle.listRecords#profileEntry")),
		"cid": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.cidString()),
		"collection": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.nsidString()),
		"did": /*#__PURE__*/ v.didString(),
		"handle": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		"rkey": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
		"uri": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.resourceUriString()),
		get "value"() {
			return /*#__PURE__*/ v.optional(AppBskyActorProfile.mainSchema)
		},
	}
);
const _recordSchema = /*#__PURE__*/ v.object(
	{
		"$type": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("games.atmo.puzzle.listRecords#record")),
		"cid": /*#__PURE__*/ v.cidString(),
		"collection": /*#__PURE__*/ v.nsidString(),
		"did": /*#__PURE__*/ v.didString(),
		"rkey": /*#__PURE__*/ v.string(),
		get "scores"() {
			return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(hydrateScoresRecordSchema))
		},
		/**
		 * Total scores count
		 */
		"scoresCount": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.integer()),
		"time_us": /*#__PURE__*/ v.integer(),
		"uri": /*#__PURE__*/ v.resourceUriString(),
		get "value"() {
			return GamesAtmoFoursPuzzle.mainSchema
		},
	}
);
type hydrateScoresRecord$schematype = typeof _hydrateScoresRecordSchema;
type main$schematype = typeof _mainSchema;
type profileEntry$schematype = typeof _profileEntrySchema;
type record$schematype = typeof _recordSchema;

export interface hydrateScoresRecordSchema extends hydrateScoresRecord$schematype {}

export interface mainSchema extends main$schematype {}

export interface profileEntrySchema extends profileEntry$schematype {}

export interface recordSchema extends record$schematype {}
export const hydrateScoresRecordSchema = _hydrateScoresRecordSchema as hydrateScoresRecordSchema;
export const mainSchema = _mainSchema as mainSchema;
export const profileEntrySchema = _profileEntrySchema as profileEntrySchema;
export const recordSchema = _recordSchema as recordSchema;

export interface HydrateScoresRecord extends v.InferInput<typeof hydrateScoresRecordSchema> {}

export interface ProfileEntry extends v.InferInput<typeof profileEntrySchema> {}

export interface Record extends v.InferInput<typeof recordSchema> {}

export interface $params extends v.InferInput<mainSchema['params']> {}

export interface $output extends v.InferXRPCBodyInput<mainSchema['output']> {}
declare module '@atcute/lexicons/ambient' {
	interface XRPCQueries {
		"games.atmo.puzzle.listRecords": mainSchema;
	}
}
