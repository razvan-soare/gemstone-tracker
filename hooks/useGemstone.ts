import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { useQuery } from "@tanstack/react-query";

export const useGemstone = (id: string) => {
	const { activeOrganization } = useSupabase();
	return useQuery({
		queryKey: ["gemstone", activeOrganization, id],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("stones")
				.select("*,images:images(*)")
				.eq("id", id)
				.eq("organization_id", activeOrganization?.id || "")
				.single();

			if (error) throw error;

			return data;
		},
	});
};
