import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';
import * as AppBskyActorProfile from "../../../app/bsky/actor/profile.js";
import * as GamesAtmoFoursPuzzle from "../fours/puzzle.js";
import * as GamesAtmoFoursScore from "../fours/score.js";

const _mainSchema = /*#__PURE__*/ v.query(
	"games.atmo.score.getRecord",
	{
		"params": /*#__PURE__*/ v.object(
			{
				/**
				 * Embed the referenced puzzle record
				 */
				"hydratePuzzle": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
				/**
				 * Include indexed profile and identity information
				 */
				"profiles": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.boolean()),
				/**
				 * AT URI of the record
				 */
				"uri": /*#__PURE__*/ v.resourceUriString(),
			}
		),
		"output": {
			"type": "lex",
			"schema": /*#__PURE__*/ v.object(
				{
					"cid": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.cidString()),
					"collection": /*#__PURE__*/ v.nsidString(),
					"did": /*#__PURE__*/ v.didString(),
					get "profiles"() {
						return /*#__PURE__*/ v.optional(/*#__PURE__*/ v.array(profileEntrySchema))
					},
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
			),
		}
	}
);
const _profileEntrySchema = /*#__PURE__*/ v.object(
	{
		"$type": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("games.atmo.score.getRecord#profileEntry")),
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
const _refPuzzleRecordSchema = /*#__PURE__*/ v.object(
	{
		"$type": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("games.atmo.score.getRecord#refPuzzleRecord")),
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
type refPuzzleRecord$schematype = typeof _refPuzzleRecordSchema;

export interface mainSchema extends main$schematype {}

export interface profileEntrySchema extends profileEntry$schematype {}

export interface refPuzzleRecordSchema extends refPuzzleRecord$schematype {}
export const mainSchema = _mainSchema as mainSchema;
export const profileEntrySchema = _profileEntrySchema as profileEntrySchema;
export const refPuzzleRecordSchema = _refPuzzleRecordSchema as refPuzzleRecordSchema;

export interface ProfileEntry extends v.InferInput<typeof profileEntrySchema> {}

export interface RefPuzzleRecord extends v.InferInput<typeof refPuzzleRecordSchema> {}

export interface $params extends v.InferInput<mainSchema['params']> {}

export interface $output extends v.InferXRPCBodyInput<mainSchema['output']> {}
declare module '@atcute/lexicons/ambient' {
	interface XRPCQueries {
		"games.atmo.score.getRecord": mainSchema;
	}
}
