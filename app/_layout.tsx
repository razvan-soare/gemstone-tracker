import "../global.css";

import { SupabaseProvider } from "@/context/supabase-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Prevent automatic refetching when app regains focus
			refetchOnWindowFocus: false,
		},
	},
});

export default function AppLayout() {
	return (
		<QueryClientProvider client={queryClient}>
			<SupabaseProvider>
				<Slot />
			</SupabaseProvider>
		</QueryClientProvider>
	);
}
