import * as Updates from "expo-updates";
import { Platform } from "react-native";

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
