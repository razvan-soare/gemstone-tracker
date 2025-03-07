import { supabase } from "@/config/supabase";
import { Session } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

// Hook to update an organization
export const useUpdateOrganization = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			organizationId,
			name,
		}: {
			organizationId: string;
			name: string;
		}) => {
			const { data, error } = await supabase
				.from("organizations")
				.update({ name, updated_at: new Date().toISOString() })
				.eq("id", organizationId)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			// Invalidate relevant queries to refresh data
			queryClient.invalidateQueries({ queryKey: ["organization_members"] });
		},
	});
};
