import type {} from '@atcute/lexicons';
import * as v from '@atcute/lexicons/validations';
import type {} from '@atcute/lexicons/ambient';
import * as AppBskyActorProfile from "../../../app/bsky/actor/profile.js";
import * as GamesAtmoFoursPuzzle from "../fours/puzzle.js";
import * as GamesAtmoFoursScore from "../fours/score.js";

const _hydrateScoresRecordSchema = /*#__PURE__*/ v.object(
	{
		"$type": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("games.atmo.puzzle.getRecord#hydrateScoresRecord")),
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
	"games.atmo.puzzle.getRecord",
	{
		"params": /*#__PURE__*/ v.object(
			{
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
			),
		}
	}
);
const _profileEntrySchema = /*#__PURE__*/ v.object(
	{
		"$type": /*#__PURE__*/ v.optional(/*#__PURE__*/ v.literal("games.atmo.puzzle.getRecord#profileEntry")),
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
type hydrateScoresRecord$schematype = typeof _hydrateScoresRecordSchema;
type main$schematype = typeof _mainSchema;
type profileEntry$schematype = typeof _profileEntrySchema;

export interface hydrateScoresRecordSchema extends hydrateScoresRecord$schematype {}

export interface mainSchema extends main$schematype {}

export interface profileEntrySchema extends profileEntry$schematype {}
export const hydrateScoresRecordSchema = _hydrateScoresRecordSchema as hydrateScoresRecordSchema;
export const mainSchema = _mainSchema as mainSchema;
export const profileEntrySchema = _profileEntrySchema as profileEntrySchema;

export interface HydrateScoresRecord extends v.InferInput<typeof hydrateScoresRecordSchema> {}

export interface ProfileEntry extends v.InferInput<typeof profileEntrySchema> {}

export interface $params extends v.InferInput<mainSchema['params']> {}

export interface $output extends v.InferXRPCBodyInput<mainSchema['output']> {}
declare module '@atcute/lexicons/ambient' {
	interface XRPCQueries {
		"games.atmo.puzzle.getRecord": mainSchema;
	}
}
