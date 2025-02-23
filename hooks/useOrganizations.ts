import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/context/supabase-provider";

export function useOrganizations() {
	const { fetchUserOrganizations } = useSupabase();

	return useQuery({
		queryKey: ["organizations"],
		queryFn: fetchUserOrganizations,
	});
}
