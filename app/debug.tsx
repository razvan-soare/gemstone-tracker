import { View, Text, ScrollView, SafeAreaView } from "react-native";
import UpdateDebugger from "@/components/UpdateDebugger";
import { Stack, useRouter } from "expo-router";
import { Button } from "@/components/ui/button";

/**
 * Debug screen for development and troubleshooting
 *
 * This screen can be accessed by:
 * 1. Navigating to the "/debug" route in the app
 * 2. Using the Link component: <Link href="/debug">Debug Tools</Link>
 * 3. Using router.push("/debug") from expo-router
 */
export default function DebugScreen() {
	const router = useRouter();

	return (
		<SafeAreaView className="flex-1 bg-white">
			<ScrollView className="flex-1 bg-white">
				<Stack.Screen options={{ title: "Debug Tools" }} />

				<View className="p-4">
					<Text className="text-2xl font-bold mb-6">Debug Tools</Text>

					<View className="mb-8">
						<Text className="text-lg font-semibold mb-2">Expo Updates</Text>
						<UpdateDebugger />
					</View>

					<Button
						size="default"
						variant="outline"
						onPress={() => router.back()}
						className="mt-4"
					>
						<Text>Back</Text>
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
