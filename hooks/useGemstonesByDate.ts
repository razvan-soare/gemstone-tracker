import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { Tables } from "@/lib/database.types";
import { useQuery } from "@tanstack/react-query";

type GemstoneWithDate = Tables<"stones"> & {
	images: Tables<"images">[];
	formattedDate: string;
};

type GroupedGemstones = {
	title: string;
	data: GemstoneWithDate[];
};

export type GemstoneFilter = "purchased" | "sold";

export const useGemstonesByDate = (filter: GemstoneFilter = "purchased") => {
	const { activeOrganization } = useSupabase();

	return useQuery({
		queryKey: ["gemstones-by-date", activeOrganization?.id, filter],
		queryFn: async () => {
			let query = supabase
				.from("stones")
				.select("*, images:images(*)")
				.eq("organization_id", activeOrganization?.id || "");

			// Apply filter based on sold status
			if (filter === "sold") {
				// Get only sold gemstones (sold_at is not null)
				query = query.not("sold", "is", null);
			} else {
				// For purchased filter, we get all gemstones regardless of sold status
				// This is the original behavior
			}

			const { data, error } = await query.order("purchase_date", {
				ascending: false,
			});

			if (error) {
				throw error;
			}

			// Group gemstones by date
			const gemstonesByDate: Record<string, GemstoneWithDate[]> = {};

			data.forEach((gemstone) => {
				// Use purchase_date as the purchase date for purchased filter
				// Use sold_at as the date for sold filter
				const dateField =
					filter === "sold" ? gemstone.sold_at : gemstone.purchase_date;
				const date = dateField ? new Date(dateField) : new Date();

				const formattedDate = date.toLocaleDateString(undefined, {
					year: "numeric",
					month: "long",
					day: "numeric",
				});

				if (!gemstonesByDate[formattedDate]) {
					gemstonesByDate[formattedDate] = [];
				}

				gemstonesByDate[formattedDate].push({
					...gemstone,
					formattedDate,
				});
			});

			// Convert to array format for SectionList
			const groupedGemstones: GroupedGemstones[] = Object.keys(
				gemstonesByDate,
			).map((date) => ({
				title: date,
				data: gemstonesByDate[date],
			}));

			return groupedGemstones;
		},
	});
};
