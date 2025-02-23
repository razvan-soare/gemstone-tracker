import "../global.css";

import { Slot } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupabaseProvider } from "@/context/supabase-provider";
import { useEffect } from "react";
import { useSupabase } from "@/context/supabase-provider";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Prevent automatic refetching when app regains focus
			refetchOnWindowFocus: false,
		},
	},
});

// Create a wrapper component to handle prefetching
function QueryProvider({ children }: { children: React.ReactNode }) {
	const { fetchGemstones, fetchUserOrganizations, session } = useSupabase();

	useEffect(() => {
		if (session) {
			// Prefetch both queries
			queryClient.prefetchQuery({
				queryKey: ["gemstones"],
				queryFn: fetchGemstones,
			});

			queryClient.prefetchQuery({
				queryKey: ["organizations"],
				queryFn: fetchUserOrganizations,
			});
		}
	}, [session, fetchGemstones, fetchUserOrganizations]);

	return children;
}

export default function AppLayout() {
	return (
		<QueryClientProvider client={queryClient}>
			<SupabaseProvider>
				<QueryProvider>
					<Slot />
				</QueryProvider>
			</SupabaseProvider>
		</QueryClientProvider>
	);
}
