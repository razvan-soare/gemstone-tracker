import { supabase } from "@/config/supabase";
import { useQuery } from "@tanstack/react-query";

export const useGemstone = (id: string) => {
	return useQuery({
		queryKey: ["gemstone", id],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("stones")
				.select("*,images:images(*)")
				.eq("id", id)
				.single();

			if (error) throw error;

			return data;
		},
	});
};
