import { View, Text, ScrollView, SafeAreaView } from "react-native";
import UpdateDebugger from "@/components/UpdateDebugger";
import { Stack, useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/config/supabase";
import { useState } from "react";

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
	const [minVersion, setMinVersion] = useState<string | null>(null);
	const getMinVersion = async () => {
		const { data, error } = await supabase.from("app_settings").select("*");
		if (error) {
			throw error;
		}
		setMinVersion(data[0].min_version);
	};

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

					<Text>Environment: {process.env.EXPO_PUBLIC_ENV}</Text>
					<Text>Supabase URL: {process.env.EXPO_PUBLIC_SUPABASE_URL}</Text>
					<Text>Supabase Key: {process.env.EXPO_PUBLIC_SUPABASE_KEY}</Text>

					<Button onPress={getMinVersion}>Get Min Version</Button>
					<Text>{minVersion}</Text>
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
