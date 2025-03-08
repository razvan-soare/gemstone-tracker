import * as Updates from "expo-updates";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "@/config/supabase";

/**
 * Helper function to check if updates are supported in the current environment
 * Returns an object with:
 * - supported: boolean indicating if updates are supported
 * - reason: string explaining why updates are not supported (if applicable)
 */
function areUpdatesSupported(): { supported: boolean; reason?: string } {
	// Skip updates on web platform
	if (Platform.OS === "web") {
		return {
			supported: false,
			reason: "Updates not supported on web platform",
		};
	}

	// Skip updates in development mode
	if (__DEV__) {
		return { supported: false, reason: "Updates skipped in development mode" };
	}

	// Skip updates in Expo Go
	const isExpoGo = Constants.appOwnership === "expo";
	if (isExpoGo) {
		return { supported: false, reason: "Updates skipped in Expo Go" };
	}

	return { supported: true };
}

/**
 * Checks for available updates and returns true if an update was downloaded and is ready to be applied
 */
export async function checkForUpdates(): Promise<boolean> {
	try {
		const { supported, reason } = areUpdatesSupported();
		if (!supported) {
			console.log(reason);
			return false;
		}

		console.log("Checking for updates...");
		console.log(`Current runtime version: ${Updates.runtimeVersion}`);
		console.log(`Update channel: ${Updates.channel}`);

		const update = await Updates.checkForUpdateAsync();
		console.log("Update check result:", update);

		if (update.isAvailable) {
			console.log("Update available, downloading...");
			const result = await Updates.fetchUpdateAsync();
			console.log("Update downloaded:", result);
			return true;
		} else {
			console.log("No updates available");
		}

		return false;
	} catch (error) {
		console.error("Error checking for updates:", error);
		return false;
	}
}

/**
 * Applies a downloaded update and reloads the app
 */
export async function applyUpdate(): Promise<void> {
	try {
		const { supported, reason } = areUpdatesSupported();
		if (!supported) {
			console.log(reason);
			return;
		}

		console.log("Applying update and reloading app...");
		await Updates.reloadAsync();
	} catch (error) {
		console.error("Error applying update:", error);
	}
}

/**
 * Checks for updates and applies them immediately if available
 * Returns true if an update was applied
 */
export async function checkAndApplyUpdates(): Promise<boolean> {
	try {
		console.log("Starting update check and apply process...");

		const { supported, reason } = areUpdatesSupported();
		if (!supported) {
			console.log(reason);
			return false;
		}

		const updateAvailable = await checkForUpdates();

		if (updateAvailable) {
			console.log("Update is available and downloaded, applying now...");
			await applyUpdate();
			return true;
		}

		console.log("No updates to apply");
		return false;
	} catch (error) {
		console.error("Error checking and applying updates:", error);
		return false;
	}
}

/**
 * Compares semantic versions
 * Returns:
 * - negative number if v1 < v2
 * - 0 if v1 === v2
 * - positive number if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
	const v1Parts = v1.split(".").map(Number);
	const v2Parts = v2.split(".").map(Number);

	for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
		const v1Part = v1Parts[i] || 0;
		const v2Part = v2Parts[i] || 0;

		if (v1Part !== v2Part) {
			return v1Part - v2Part;
		}
	}

	return 0;
}

/**
 * Checks if the current app version meets the minimum required version
 * Returns an object with:
 * - needsUpdate: boolean indicating if an update is required
 * - currentVersion: the current app version
 * - minVersion: the minimum required version from the server
 */
export async function checkMinimumVersion(): Promise<{
	needsUpdate: boolean;
	currentVersion: string;
	minVersion: string | null;
}> {
	try {
		// Get current app version from app.json
		const currentVersion = Constants.expoConfig?.version || "0.0.0";

		// Fetch minimum required version from Supabase
		const { data, error } = await supabase
			.from("app_settings")
			.select("min_version")
			.single();

		if (error) {
			console.error("Error fetching minimum version:", error);
			return { needsUpdate: false, currentVersion, minVersion: null };
		}

		const minVersion = data?.min_version;

		if (!minVersion) {
			return { needsUpdate: false, currentVersion, minVersion: null };
		}

		// Compare versions
		const comparison = compareVersions(currentVersion, minVersion);

		return {
			needsUpdate: comparison < 0, // Current version is less than minimum version
			currentVersion,
			minVersion,
		};
	} catch (error) {
		console.error("Error checking minimum version:", error);
		return {
			needsUpdate: false,
			currentVersion: Constants.expoConfig?.version || "0.0.0",
			minVersion: null,
		};
	}
}
