import { supabase } from "@/config/supabase";
import { useInfiniteQuery } from "@tanstack/react-query";

type GemstoneFilters = {
	search?: string;
	shape?: string;
};

const ITEMS_PER_PAGE = 20;

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
				query = query.or(
					`name.ilike.%${filters.search}%,` +
						`shape.ilike.%${filters.search}%,` +
						`color.ilike.%${filters.search}%,` +
						`cut.ilike.%${filters.search}%` +
						`weight.ilike.%${filters.search}%`,
				);
			}

			// Add shape filter if provided
			if (filters.shape) {
				query = query.eq("shape", filters.shape);
			}

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
