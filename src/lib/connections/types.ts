export type ConnectionsGroup = {
	category: string;
	words: [string, string, string, string];
	difficulty: 0 | 1 | 2 | 3;
};

export type ConnectionsPuzzle = {
	groups: [ConnectionsGroup, ConnectionsGroup, ConnectionsGroup, ConnectionsGroup];
};
