import { useLanguage } from "@/hooks/useLanguage";
import React from "react";
import { Linking, Platform, Text, View } from "react-native";
import { P } from "./ui/typography";
import { SafeAreaView } from "react-native-safe-area-context";

interface UpdateRequiredModalProps {
	currentVersion: string;
	minVersion: string;
}

export function UpdateRequiredModal({
	currentVersion,
	minVersion,
}: UpdateRequiredModalProps) {
	const { t } = useLanguage();
	const handleUpdate = () => {
		// Open the app store based on platform
		if (Platform.OS === "ios") {
			// Replace with your actual iOS App Store ID
			Linking.openURL("https://apps.apple.com/app/id6742846901");
		} else if (Platform.OS === "android") {
			Linking.openURL(
				"https://play.google.com/store/apps/details?id=com.razvansoare.gemtracker",
			);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background">
			<View className="mx-auto my-auto max-w-[90%] rounded-lg">
				<P className="text-xl font-semibold text-center">
					{t("update.requiredTitle")}
				</P>
				<P className="text-center text-muted-foreground">
					{t("update.requiredDescription")}
				</P>
				<View className="py-4 flex flex-col items-center">
					<Text className="text-center mb-2">
						{t("update.currentVersion")}:{" "}
						<Text className="font-bold">{currentVersion}</Text>
					</Text>
					<Text className="text-center mb-6">
						{t("update.requiredVersion")}:{" "}
						<Text className="font-bold">{minVersion}</Text>
					</Text>
					<View
						className="bg-primary px-6 py-3 rounded-md"
						onTouchEnd={handleUpdate}
					>
						<Text className="text-primary-foreground font-medium text-center">
							{t("update.updateNow")}
						</Text>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
