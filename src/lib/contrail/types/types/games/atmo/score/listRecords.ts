import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';
import * as AppBskyActorProfile from "../../../app/bsky/actor/profile.js";
import * as GamesAtmoFoursPuzzle from "../fours/puzzle.js";
import * as GamesAtmoFoursScore from "../fours/score.js";

const _mainSchema = /*#__PURE__*/ v.query(
	"games.atmo.score.listRecords",
	{
		"params": /*#__PURE__*/ v.object(
			{
				/**
				 * Filter by an indexed DID or cached handle
				 */
				"actor": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.actorIdentifierString()),
				"cursor": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
				/**
				 * Embed the referenced puzzle record
				 */
				"hydratePuzzle": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
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
				 * Filter by puzzle.uri
				 */
				"puzzleUri": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
				/**
				 * Full-text search across: puzzle.uri, state
				 */
				"search": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
				/**
				 * Field to sort by (default: time_us)
				 */
				"sort": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string<"puzzleUri" | "state" | (string & {})>()),
				/**
				 * Filter by state
				 */
				"state": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.string()),
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
		"$type": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("games.atmo.score.listRecords#profileEntry")),
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
		"$type": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("games.atmo.score.listRecords#record")),
		"cid": /*#__PURE__*/ v.cidString(),
		"collection": /*#__PURE__*/ v.nsidString(),
		"did": /*#__PURE__*/ v.didString(),
		get "puzzle"() {
			return /*#__PURE__*/ v.optional(refPuzzleRecordSchema)
		},
		"rkey": /*#__PURE__*/ v.string(),
		"time_us": /*#__PURE__*/ v.integer(),
		"uri": /*#__PURE__*/ v.resourceUriString(),
		get "value"() {
			return GamesAtmoFoursScore.mainSchema
		},
	}
);
const _refPuzzleRecordSchema = /*#__PURE__*/ v.object(
	{
		"$type": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("games.atmo.score.listRecords#refPuzzleRecord")),
		"cid": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.cidString()),
		"collection": /*#__PURE__*/ v.nsidString(),
		"did": /*#__PURE__*/ v.didString(),
		"rkey": /*#__PURE__*/ v.string(),
		"time_us": /*#__PURE__*/ v.integer(),
		"uri": /*#__PURE__*/ v.resourceUriString(),
		get "value"() {
			return GamesAtmoFoursPuzzle.mainSchema
		},
	}
);
type main$schematype = typeof _mainSchema;
type profileEntry$schematype = typeof _profileEntrySchema;
type record$schematype = typeof _recordSchema;
type refPuzzleRecord$schematype = typeof _refPuzzleRecordSchema;

export interface mainSchema extends main$schematype {}

export interface profileEntrySchema extends profileEntry$schematype {}

export interface recordSchema extends record$schematype {}

export interface refPuzzleRecordSchema extends refPuzzleRecord$schematype {}
export const mainSchema = _mainSchema as mainSchema;
export const profileEntrySchema = _profileEntrySchema as profileEntrySchema;
export const recordSchema = _recordSchema as recordSchema;
export const refPuzzleRecordSchema = _refPuzzleRecordSchema as refPuzzleRecordSchema;

export interface ProfileEntry extends v.InferInput<typeof profileEntrySchema> {}

export interface Record extends v.InferInput<typeof recordSchema> {}

export interface RefPuzzleRecord extends v.InferInput<typeof refPuzzleRecordSchema> {}

export interface $params extends v.InferInput<mainSchema['params']> {}

export interface $output extends v.InferXRPCBodyInput<mainSchema['output']> {}
declare module '@atcute/lexicons/ambient' {
	interface XRPCQueries {
		"games.atmo.score.listRecords": mainSchema;
	}
}
