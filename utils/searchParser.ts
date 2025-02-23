type SearchCondition = {
	type: "AND" | "OR" | "NONE";
	terms: string[];
};

export const parseSearchQuery = (query: string): SearchCondition => {
	if (query.includes("&")) {
		return {
			type: "AND",
			terms: query
				.split("&")
				.map((term) => term.trim())
				.filter(Boolean),
		};
	} else if (query.includes("|")) {
		return {
			type: "OR",
			terms: query
				.split("|")
				.map((term) => term.trim())
				.filter(Boolean),
		};
	}

	// Default to single term OR search
	return {
		type: "NONE",
		terms: [query.trim()],
	};
};
