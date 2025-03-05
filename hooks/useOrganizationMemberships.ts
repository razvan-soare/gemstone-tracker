import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { useQuery } from "@tanstack/react-query";

export const useOrganizationMemberships = () => {
	const { session } = useSupabase();
	return useQuery({
		queryKey: ["organization_members"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("organization_members")
				.select("*, organization:organization_id(*)");

			if (error) throw error;

			return data;
		},
		enabled: !!session,
	});
};
