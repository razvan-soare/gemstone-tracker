import { checkAndApplyUpdates } from "@/lib/updates";
import { useState } from "react";
import { Button, Text, View } from "react-native";

interface UpdateCheckerProps {
	buttonText?: string;
}

export default function UpdateChecker({
	buttonText = "Check for Updates",
}: UpdateCheckerProps) {
	const [checking, setChecking] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const handleCheckForUpdates = async () => {
		try {
			setChecking(true);
			setMessage("Checking for updates...");

			const updateApplied = await checkAndApplyUpdates();

			if (updateApplied) {
				setMessage("Update found! Reloading app...");
			} else {
				setMessage("No updates available.");

				// Clear message after 3 seconds
				setTimeout(() => {
					setMessage(null);
				}, 3000);
			}
		} catch (error) {
			setMessage("Error checking for updates.");
			console.error(error);

			// Clear message after 3 seconds
			setTimeout(() => {
				setMessage(null);
			}, 3000);
		} finally {
			setChecking(false);
		}
	};

	return (
		<View className="my-4">
			<Button
				title={buttonText}
				onPress={handleCheckForUpdates}
				disabled={checking}
			/>
			{message && <Text className="text-center mt-2 text-sm">{message}</Text>}
		</View>
	);
}
