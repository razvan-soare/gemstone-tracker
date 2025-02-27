import { SafeAreaView, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2, Muted } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";
import { useColorScheme } from "@/lib/useColorScheme";

export default function Settings() {
	const { signOut } = useSupabase();
	const { colorScheme, toggleColorScheme } = useColorScheme();

	return (
		<SafeAreaView style={styles.container}>
			<View className="flex-1 p-4 gap-y-8">
				<View className="gap-y-8">
					<H1>Settings</H1>

					<View className="gap-y-2">
						<H2>Appearance</H2>
						<Muted>Change the app's appearance</Muted>
						<Button
							className="w-full"
							size="default"
							variant="outline"
							onPress={toggleColorScheme}
						>
							<Text>{colorScheme === "dark" ? "Light Mode" : "Dark Mode"}</Text>
						</Button>
					</View>
				</View>

				<View className="gap-y-2">
					<H2>Account</H2>
					<Muted>Sign out and return to the welcome screen.</Muted>
					<Button
						className="w-full"
						size="default"
						variant="destructive"
						onPress={signOut}
					>
						<Text>Sign Out</Text>
					</Button>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
