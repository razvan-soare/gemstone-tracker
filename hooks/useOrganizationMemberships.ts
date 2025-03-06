import { supabase } from "@/config/supabase";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

export const useOrganizationMemberships = (session: Session | null) => {
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
