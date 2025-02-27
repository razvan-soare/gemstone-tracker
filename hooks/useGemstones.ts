import { supabase } from "@/config/supabase";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseSearchQuery } from "@/lib/searchParser";
import {
	GemstoneColor,
	GemstoneCut,
	GemstoneShape,
} from "@/app/types/gemstone";
import { useSupabase } from "@/context/supabase-provider";

type GemstoneFilters = {
	search?: string;
	shape?: GemstoneShape;
	color?: GemstoneColor;
	cut?: GemstoneCut;
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
	const { activeOrganization } = useSupabase();
	return useInfiniteQuery({
		queryKey: ["gemstones", activeOrganization, filters],
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

			// Add cut filter if provided
			if (filters.cut) {
				query = query.eq("cut", filters.cut);
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
