import { supabase } from "@/config/supabase";
import { useQuery } from "@tanstack/react-query";

export const useOrganizationMemberships = () => {
	return useQuery({
		queryKey: ["organization_members"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("organization_members")
				.select("*, organization:organization_id(*)");

			if (error) throw error;

			return data;
		},
	});
};
