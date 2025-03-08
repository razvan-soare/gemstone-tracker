import * as Updates from "expo-updates";
import { useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { checkAndApplyUpdates } from "@/lib/updates";
import Constants from "expo-constants";

export default function UpdateDebugger() {
	const [updateInfo, setUpdateInfo] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);

	const getUpdateInfo = async () => {
		setIsLoading(true);
		try {
			let info = "";

			// Get environment info
			info += `Environment: ${__DEV__ ? "Development" : "Production"}\n`;
			info += `Platform: ${Constants.platform?.os || "unknown"}\n`;
			info += `App Ownership: ${Constants.appOwnership || "unknown"}\n`;
			info += `Is Expo Go: ${Constants.appOwnership === "expo" ? "Yes" : "No"}\n`;
			info += `Updates Enabled: ${__DEV__ || Constants.appOwnership === "expo" ? "No (dev/Expo Go)" : "Yes"}\n\n`;

			// Get basic update info
			info += `App Version: ${Constants.expoConfig?.version || "unknown"}\n`;
			info += `Runtime Version: ${Updates.runtimeVersion}\n`;
			info += `Update Channel: ${Updates.channel}\n`;
			info += `Is Embedded Update: ${Updates.isEmbeddedLaunch}\n\n`;

			// Check for updates
			info += "Checking for updates...\n";

			// Skip actual update check in dev/Expo Go
			if (__DEV__ || Constants.appOwnership === "expo") {
				info += "Update check skipped in development mode or Expo Go\n";
			} else {
				try {
					const update = await Updates.checkForUpdateAsync();
					info += `Update Available: ${update.isAvailable}\n`;

					if (update.isAvailable) {
						info += "Downloading update...\n";
						await Updates.fetchUpdateAsync();
						info += "Update downloaded and ready to apply\n";
					}
				} catch (error) {
					info += `Error checking for updates: ${error instanceof Error ? error.message : String(error)}\n`;
				}
			}

			setUpdateInfo(info);
		} catch (error) {
			setUpdateInfo(
				`Error: ${error instanceof Error ? error.message : String(error)}`,
			);
		} finally {
			setIsLoading(false);
		}
	};

	const applyUpdate = async () => {
		setIsLoading(true);
		try {
			// Skip in dev/Expo Go
			if (__DEV__ || Constants.appOwnership === "expo") {
				setUpdateInfo(
					updateInfo +
						"\nUpdate application skipped in development mode or Expo Go",
				);
				return;
			}

			await checkAndApplyUpdates();
			setUpdateInfo(updateInfo + "\nApplying update...");
		} catch (error) {
			setUpdateInfo(
				updateInfo +
					`\nError applying update: ${error instanceof Error ? error.message : String(error)}`,
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View className="p-4">
			<Text className="text-xl font-bold mb-4">Update Debugger</Text>

			<View className="flex-row space-x-2 mb-4">
				<Button
					title="Check for Updates"
					onPress={getUpdateInfo}
					disabled={isLoading}
				/>
				<Button
					title="Apply Update"
					onPress={applyUpdate}
					disabled={isLoading || !updateInfo.includes("ready to apply")}
				/>
			</View>

			<ScrollView className="bg-gray-100 p-2 rounded-md h-64">
				<Text className="font-mono">
					{updateInfo || "Press 'Check for Updates' to start"}
				</Text>
			</ScrollView>
		</View>
	);
}
