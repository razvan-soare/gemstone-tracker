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

export const useGemstonesByDate = () => {
	const { activeOrganization } = useSupabase();

	return useQuery({
		queryKey: ["gemstones-by-date", activeOrganization?.id],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("stones")
				.select("*, images:images(*)")
				.eq("organization_id", activeOrganization?.id || "")
				.order("created_at", { ascending: false });

			if (error) {
				throw error;
			}

			// Group gemstones by date
			const gemstonesByDate: Record<string, GemstoneWithDate[]> = {};

			data.forEach((gemstone) => {
				// Use created_at as the purchase date
				const date = gemstone.created_at
					? new Date(gemstone.created_at)
					: new Date();

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
