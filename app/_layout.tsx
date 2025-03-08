import "../global.css";

import { SupabaseProvider } from "@/context/supabase-provider";
import { checkAndApplyUpdates } from "@/lib/updates";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import { useEffect } from "react";

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
	useEffect(() => {
		// Check for updates when the app starts
		checkAndApplyUpdates().catch((error) => {
			console.error("Failed to check for updates:", error);
		});
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<SupabaseProvider>
				<Slot />
			</SupabaseProvider>
		</QueryClientProvider>
	);
}
