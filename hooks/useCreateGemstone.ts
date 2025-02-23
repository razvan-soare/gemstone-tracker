import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/context/supabase-provider";
import { Tables } from "@/lib/database.types";

export type CreateGemstoneInputType = Omit<
	Tables<"stones">,
	"id" | "created_at" | "updated_at" | "certificate_id"
>;

export function useCreateGemstone() {
	const { createGemstone } = useSupabase();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (gemstone: CreateGemstoneInputType) => createGemstone(gemstone),
		onSuccess: () => {
			// Invalidate and refetch gemstones query
			queryClient.invalidateQueries({ queryKey: ["gemstones"] });
		},
	});
}
