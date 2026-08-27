export type FoursScoreRecord = {
	puzzle: { uri: string };
	guesses: { words: [string, string, string, string] }[];
	state: 'games.atmo.fours.score#won' | 'games.atmo.fours.score#lost';
};

export type LocalScoreEntry = {
	rkey: string;
	puzzleUri: string;
	record: FoursScoreRecord;
	savedAt: number;
};
