import * as Updates from "expo-updates";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "@/config/supabase";

/**
 * Checks for available updates and returns true if an update was downloaded and is ready to be applied
 */
export async function checkForUpdates(): Promise<boolean> {
	try {
		if (Platform.OS === "web") {
			return false;
		}

		const update = await Updates.checkForUpdateAsync();

		if (update.isAvailable) {
			await Updates.fetchUpdateAsync();
			return true;
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
		const updateAvailable = await checkForUpdates();

		if (updateAvailable) {
			await applyUpdate();
			return true;
		}

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
