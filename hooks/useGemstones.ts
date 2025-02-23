import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/context/supabase-provider";

export function useGemstones() {
	const { fetchGemstones } = useSupabase();

	return useQuery({
		queryKey: ["gemstones"],
		queryFn: fetchGemstones,
	});
}
