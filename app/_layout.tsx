import "../global.css";

import { SupabaseProvider } from "@/context/supabase-provider";
import { checkAndApplyUpdates, checkMinimumVersion } from "@/lib/updates";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { UpdateRequiredModal } from "@/components/UpdateRequiredModal";
import { SplashScreen } from "expo-router";
import * as Sentry from "@sentry/react-native";

Sentry.init({
	dsn: "https://51fc8167bd38775d4511e5ea025b66e4@o4508983038377984.ingest.de.sentry.io/4508983039295568",

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: __DEV__,
});

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Prevent automatic refetching when app regains focus
			refetchOnWindowFocus: false,
		},
	},
});

export default Sentry.wrap(function AppLayout() {
	const [versionCheck, setVersionCheck] = useState<{
		needsUpdate: boolean;
		currentVersion: string;
		minVersion: string | null;
	}>({
		needsUpdate: false,
		currentVersion: "",
		minVersion: null,
	});
	const [isCheckingVersion, setIsCheckingVersion] = useState(true);

	useEffect(() => {
		async function checkVersions() {
			try {
				// Check for OTA updates when the app starts
				await checkAndApplyUpdates();

				// Check minimum version requirement
				const result = await checkMinimumVersion();
				setVersionCheck(result);
			} catch (error) {
				console.error("Failed to check versions:", error);
			} finally {
				setIsCheckingVersion(false);
				SplashScreen.hideAsync().catch(console.error);
			}
		}

		checkVersions();
	}, []);

	// Show splash screen while checking version
	if (isCheckingVersion) {
		return null; // SplashScreen will be shown
	}

	// If an update is required, show the update modal and prevent access to the app
	if (versionCheck.needsUpdate && versionCheck.minVersion) {
		return (
			<UpdateRequiredModal
				currentVersion={versionCheck.currentVersion}
				minVersion={versionCheck.minVersion}
			/>
		);
	}

	return (
		<QueryClientProvider client={queryClient}>
			<SupabaseProvider>
				<Slot />
			</SupabaseProvider>
		</QueryClientProvider>
	);
});
