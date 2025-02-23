import { supabase } from "@/config/supabase";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseSearchQuery } from "@/utils/searchParser";

type GemstoneFilters = {
	search?: string;
	shape?: string;
};

const ITEMS_PER_PAGE = 20;

const buildSearchQuery = (term: string) => {
	const isNumber = !Number.isNaN(Number(term));
	if (isNumber) {
		return `weight.eq.${Number(term).toFixed(2)}`;
	}
	return (
		`name.ilike.%${term}%,` +
		`shape.ilike.%${term}%,` +
		`color.ilike.%${term}%,` +
		`cut.ilike.%${term}%`
	);
};

export const useGemstones = (filters: GemstoneFilters = {}) => {
	return useInfiniteQuery({
		queryKey: ["gemstones", filters],
		queryFn: async ({ pageParam = 0 }) => {
			let query = supabase
				.from("stones")
				.select("*", { count: "exact" })
				.range(
					pageParam * ITEMS_PER_PAGE,
					(pageParam + 1) * ITEMS_PER_PAGE - 1,
				);

			// Add search filter if provided
			if (filters.search) {
				const queryInput = parseSearchQuery(filters.search);
				if (queryInput.type === "AND") {
					for (const clause of queryInput.terms) {
						query = query.or(buildSearchQuery(clause));
					}
				} else if (queryInput.type === "OR") {
					query = query.or(queryInput.terms.map(buildSearchQuery).join(","));
				} else {
					query = query.or(buildSearchQuery(queryInput.terms[0]));
				}
			}

			// Add shape filter if provided
			if (filters.shape) {
				query = query.eq("shape", filters.shape);
			}

			console.log("🟥", query);
			const { data, error, count } = await query;

			if (error) {
				throw error;
			}

			return {
				items: data,
				nextPage: data.length === ITEMS_PER_PAGE ? pageParam + 1 : undefined,
				totalCount: count,
			};
		},
		getNextPageParam: (lastPage) => lastPage.nextPage,
		initialPageParam: 0,
	});
};
