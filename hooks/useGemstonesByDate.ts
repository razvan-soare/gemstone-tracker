import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { Tables } from "@/lib/database.types";
import { useQuery } from "@tanstack/react-query";
import { formatDateToDisplay } from "@/lib/utils";

type GemstoneWithDate = Tables<"stones"> & {
	images: Tables<"images">[];
	formattedDate: string;
};

type GroupedGemstones = {
	title: string;
	data: GemstoneWithDate[];
};

export type GemstoneFilter = "all" | "stock" | "sold";

export const useGemstonesByDate = (filter: GemstoneFilter = "all") => {
	const { activeOrganization } = useSupabase();

	return useQuery({
		queryKey: ["gemstones-by-date", activeOrganization?.id, filter],
		queryFn: async () => {
			let query = supabase
				.from("stones")
				.select("*, images:images(*)")
				.is("deleted_at", null)
				.eq("organization_id", activeOrganization?.id || "");

			// Apply filter based on sold status
			if (filter === "sold") {
				// Get only sold gemstones (sold_at is not null)
				query = query.is("sold", true);
			} else if (filter === "stock") {
				// For stock filter, we get only unsold gemstones
				query = query.is("sold", false);
			}
			// For "all" filter, we don't apply any additional conditions

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
				const date = dateField ? new Date(dateField) : null

				const formattedDate = formatDateToDisplay(date);

				if (!gemstonesByDate[formattedDate]) {
					gemstonesByDate[formattedDate] = [];
				}

				gemstonesByDate[formattedDate].push({
					...gemstone,
					formattedDate,
				});
			});
	
			// Convert to array format for SectionList
			const groupedGemstones: GroupedGemstones[] = Object.keys(gemstonesByDate)
				.map((date) => {
					const groupData = gemstonesByDate[date];

					// Sort gemstones inside the group by created_at descending
					const sortedGroupData = groupData.sort((a, b) => {
						const createdAtA = a.created_at ? new Date(a.created_at).getTime() : 0;
						const createdAtB = b.created_at ? new Date(b.created_at).getTime() : 0;
						return createdAtB - createdAtA;
					});

					return {
						title: date,
						data: sortedGroupData,
					};
				});

			return groupedGemstones;
		},
	});
};
