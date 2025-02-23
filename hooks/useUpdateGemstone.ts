import { supabase } from "@/config/supabase";
import { Tables } from "@/lib/database.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UpdateGemstoneInput = Partial<Tables<"stones">> & { id: string };

export const useUpdateGemstone = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: UpdateGemstoneInput) => {
			const { id, ...updates } = input;
			const { data, error } = await supabase
				.from("stones")
				.update(updates)
				.eq("id", id)
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["gemstone", data.id] });
			queryClient.invalidateQueries({ queryKey: ["gemstones"] });
		},
	});
};
