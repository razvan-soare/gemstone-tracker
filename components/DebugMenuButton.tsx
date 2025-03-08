import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

/**
 * A hidden debug menu button that activates after multiple taps
 *
 * Place this component in settings, profile, or other screens
 * where you want to provide access to debug tools
 */
export default function DebugMenuButton() {
	const router = useRouter();
	const [tapCount, setTapCount] = useState(0);

	const handlePress = () => {
		const newCount = tapCount + 1;
		setTapCount(newCount);

		// Navigate to debug screen after 7 taps
		if (newCount >= 7) {
			setTapCount(0);
			router.push("/debug");
		}

		// Reset count after 3 seconds of inactivity
		setTimeout(() => {
			setTapCount(0);
		}, 3000);
	};

	return (
		<Pressable onPress={handlePress} className="p-2">
			<View className="h-8 w-8 rounded-full bg-transparent" />
			{tapCount > 0 && tapCount < 7 && (
				<View className="absolute bottom-0 right-0">
					<Text className="text-xs text-gray-400">{7 - tapCount}</Text>
				</View>
			)}
		</Pressable>
	);
}
