import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

export const useDeleteGemstone = () => {
	const queryClient = useQueryClient();
	const { activeOrganization } = useSupabase();
	const router = useRouter();

	return useMutation({
		mutationFn: async (id: string) => {
			// First delete related images
			const { error: imagesError } = await supabase
				.from("images")
				.delete()
				.eq("stone_id", id);

			if (imagesError) throw imagesError;

			// Then delete the gemstone
			const { data, error } = await supabase
				.from("stones")
				.delete()
				.eq("id", id)
				.eq("organization_id", activeOrganization?.id || "")
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			// Invalidate gemstone list queries
			queryClient.invalidateQueries({
				queryKey: ["gemstones", activeOrganization],
			});

			// Invalidate gemstones-by-date (history page) queries
			queryClient.invalidateQueries({
				queryKey: ["gemstones-by-date", activeOrganization?.id],
				exact: false,
			});

			// Navigate back to the gemstones list
			router.back();
		},
	});
};
