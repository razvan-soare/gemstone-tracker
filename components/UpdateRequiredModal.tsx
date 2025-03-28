import React from "react";
import { View, Text, Linking, Platform } from "react-native";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface UpdateRequiredModalProps {
	currentVersion: string;
	minVersion: string;
}

export function UpdateRequiredModal({
	currentVersion,
	minVersion,
}: UpdateRequiredModalProps) {
	const handleUpdate = () => {
		// Open the app store based on platform
		if (Platform.OS === "ios") {
			// Replace with your actual iOS App Store ID
			Linking.openURL("https://apps.apple.com/app/id[YOUR_APP_ID]");
		} else if (Platform.OS === "android") {
			Linking.openURL(
				"https://play.google.com/store/apps/details?id=com.razvansoare.gemtracker",
			);
		}
	};

	return (
		<Dialog open={true}>
			<DialogContent className="mx-auto my-auto max-w-[90%] rounded-lg">
				<DialogTitle className="text-xl font-semibold text-center">
					Update Required
				</DialogTitle>
				<DialogDescription className="text-center text-muted-foreground">
					A new version of the app is required to continue.
				</DialogDescription>
				<View className="py-4 flex flex-col items-center">
					<Text className="text-center mb-2">
						Your current version:{" "}
						<Text className="font-bold">{currentVersion}</Text>
					</Text>
					<Text className="text-center mb-6">
						Required version: <Text className="font-bold">{minVersion}</Text>
					</Text>
					<View
						className="bg-primary px-6 py-3 rounded-md"
						onTouchEnd={handleUpdate}
					>
						<Text className="text-primary-foreground font-medium text-center">
							Update Now
						</Text>
					</View>
				</View>
			</DialogContent>
		</Dialog>
	);
}
