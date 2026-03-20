export type FoursScoreRecord = {
	puzzle: { uri: string };
	guesses: { words: [string, string, string, string] }[];
	state: 'won' | 'lost';
};

export type LocalScoreEntry = {
	rkey: string;
	puzzleUri: string;
	record: FoursScoreRecord;
	savedAt: number;
};
