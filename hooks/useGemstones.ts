import { supabase } from "@/config/supabase";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseSearchQuery } from "@/lib/searchParser";
import {
	GemstoneColor,
	GemstoneShape,
	GemstoneSize,
	GemstoneOwner,
} from "@/app/types/gemstone";
import { useSupabase } from "@/context/supabase-provider";

type GemstoneFilters = {
	search?: string;
	shape?: GemstoneShape;
	color?: GemstoneColor;
	size?: GemstoneSize;
	sold?: boolean;
	owner?: GemstoneOwner;
};

const ITEMS_PER_PAGE = 20;

const buildSearchQuery = (term: string) => {
	const isNumber = !Number.isNaN(Number(term));
	if (isNumber) {
		return (
			`weight.eq.${Number(term).toFixed(2)},` +
			`name.ilike.%${term}%,` +
			`bill_number.ilike.%${term}%`
		);
	}
	return (
		`name.ilike.%${term}%,` +
		`bill_number.ilike.%${term}%,` +
		`gem_type.ilike.%${term}%,` +
		`shape.ilike.%${term}%,` +
		`color.ilike.%${term}%,` +
		`cut.ilike.%${term}%`
	);
};

export const useGemstones = (filters: GemstoneFilters = {}) => {
	const { session, activeOrganization } = useSupabase();
	return useInfiniteQuery({
		queryKey: ["gemstones", activeOrganization, filters],
		enabled: !!session && !!activeOrganization,
		queryFn: async ({ pageParam = 0 }) => {
			let query = supabase
				.from("stones")
				.select("*, images:images(*)", {
					count: "exact",
				})
				.eq("organization_id", activeOrganization?.id || "")
				.order("created_at", { ascending: false })
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

			// Add color filter if provided
			if (filters.color) {
				query = query.eq("color", filters.color);
			}

			// Add size filter if provided
			if (filters.size) {
				// Handle different size ranges
				switch (filters.size) {
					case GemstoneSize.RANGE_0_1:
						query = query.gte("weight", 0).lt("weight", 1);
						break;
					case GemstoneSize.RANGE_1_2:
						query = query.gte("weight", 1).lt("weight", 2);
						break;
					case GemstoneSize.RANGE_2_3:
						query = query.gte("weight", 2).lt("weight", 3);
						break;
					case GemstoneSize.RANGE_3_4:
						query = query.gte("weight", 3).lt("weight", 4);
						break;
					case GemstoneSize.RANGE_4_5:
						query = query.gte("weight", 4).lt("weight", 5);
						break;
					case GemstoneSize.RANGE_5_6:
						query = query.gte("weight", 5).lt("weight", 6);
						break;
					case GemstoneSize.RANGE_6_7:
						query = query.gte("weight", 6).lt("weight", 7);
						break;
					case GemstoneSize.RANGE_7_8:
						query = query.gte("weight", 7).lt("weight", 8);
						break;
					case GemstoneSize.RANGE_8_9:
						query = query.gte("weight", 8).lt("weight", 9);
						break;
					case GemstoneSize.RANGE_9_10:
						query = query.gte("weight", 9).lt("weight", 10);
						break;
					case GemstoneSize.RANGE_10_PLUS:
						query = query.gte("weight", 10);
						break;
				}
			}

			// Add sold filter if provided
			if (filters.sold === true) {
				query = query.not("sold_at", "is", null);
			}

			// Add owner filter if provided
			if (filters.owner) {
				query = query.eq("owner", filters.owner);
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
