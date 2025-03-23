import { useState } from "react";
import {
	Pressable,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import { Dropdown } from "react-native-paper-dropdown";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H2, H3, Muted } from "@/components/ui/typography";
import { colors } from "@/constants/colors";
import { useSupabase } from "@/context/supabase-provider";
import { useColumnPreference } from "@/hooks/useColumnPreference";
import { useOrganizationMemberships } from "@/hooks/useOrganizationMemberships";
import { useColorScheme } from "@/lib/useColorScheme";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

export default function Settings() {
	const { signOut, activeOrganization, userOrganizations, user, session } =
		useSupabase();
	const { colorScheme, toggleColorScheme } = useColorScheme();
	const { columnCount, updateColumnCount } = useColumnPreference();

	const [showDevOptions, setShowDevOptions] = useState(false);
	const [devTapCount, setDevTapCount] = useState(0);
	const router = useRouter();

	// Get organization memberships to check if user is owner
	const { data: organizationMemberships = [] } =
		useOrganizationMemberships(session);

	return (
		<SafeAreaView
			style={[
				styles.container,
				{
					backgroundColor:
						colorScheme === "dark"
							? colors.dark.background
							: colors.light.background,
				},
			]}
		>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollViewContent}
				showsVerticalScrollIndicator={false}
			>
				<View className="gap-y-4">
					<View className="w-full items-center justify-center py-4">
						<H2>Settings</H2>
					</View>

					{userOrganizations.length > 0 && (
						<View className="gap-y-2">
							<H3>Organization</H3>
							<Button
								className="w-full mt-2"
								size="default"
								variant="outline"
								onPress={() => router.push("/(app)/organizations")}
							>
								<Text>Manage Organizations</Text>
							</Button>
						</View>
					)}

					<View className="gap-y-2">
						<H3>App Preferences</H3>
						<Muted>Customize the app's appearance and layout</Muted>

						<View className="flex-row flex-wrap gap-2 mt-2">
							<View className="flex-1 min-w-[120px]">
								<Dropdown
									label="Theme"
									mode="outlined"
									hideMenuHeader
									menuContentStyle={{ top: 60 }}
									value={colorScheme}
									onSelect={(value) => {
										if (!value) return;
										if (value !== colorScheme) {
											toggleColorScheme();
										}
									}}
									options={[
										{ label: "Light Mode", value: "light" },
										{ label: "Dark Mode", value: "dark" },
									]}
								/>
							</View>

							<View className="flex-1 min-w-[120px]">
								<Dropdown
									label="Columns"
									mode="outlined"
									hideMenuHeader
									menuContentStyle={{ top: 60 }}
									value={columnCount ? columnCount.toString() : "2"}
									onSelect={(value) => {
										if (!value) return;
										if (updateColumnCount) {
											updateColumnCount(parseInt(value));
										}
									}}
									options={[1, 2, 3, 4, 5].map((count) => ({
										label: `${count} Column${count > 1 ? "s" : ""}`,
										value: count.toString(),
									}))}
								/>
							</View>
						</View>
					</View>

					<View className="gap-y-2">
						<H3>Account</H3>
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

				{/* App Info Section */}
				<View className="gap-y-2 mt-4">
					<H3>App Info</H3>

					{/* Version number that can be tapped to reveal developer options */}
					<Pressable
						onPress={() => {
							const newCount = devTapCount + 1;
							setDevTapCount(newCount);

							// Show developer options after 7 taps
							if (newCount >= 7) {
								setShowDevOptions(true);
								setDevTapCount(0);
							}

							// Reset count after 3 seconds
							setTimeout(() => {
								setDevTapCount(0);
							}, 3000);
						}}
					>
						<Text className="text-sm text-gray-500">
							Build: {Constants.expoConfig?.ios?.buildNumber || "Unknown"}
						</Text>
					</Pressable>
				</View>

				{/* Developer Options - Only shown after activating */}
				{showDevOptions && (
					<View className="gap-y-2 mt-4 border-t border-gray-200 pt-4">
						<H3>Developer Options</H3>
						<Muted>Tools for debugging and development</Muted>

						<Button
							className="w-full mt-2"
							size="default"
							variant="outline"
							onPress={() => router.push("/debug")}
						>
							<Text>Debug Tools</Text>
						</Button>

						<Button
							className="w-full mt-2"
							size="default"
							variant="outline"
							onPress={() => setShowDevOptions(false)}
						>
							<Text>Hide Developer Options</Text>
						</Button>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollViewContent: {
		padding: 16,
		paddingBottom: 32,
	},

	membersCard: {
		marginTop: 8,
	},
	cardContent: {
		padding: 0,
		paddingVertical: 0,
	},
	listItem: {
		paddingVertical: 4,
		minHeight: 48,
	},
	listItemTitle: {
		fontSize: 14,
	},
	listItemDescription: {
		fontSize: 12,
	},
	emptyContainer: {
		padding: 16,
		alignItems: "center",
	},
	modalContainer: {
		padding: 20,
		margin: 20,
		borderRadius: 8,
	},
	input: {
		marginTop: 16,
		marginBottom: 8,
	},
	errorText: {
		color: "red",
		marginBottom: 16,
	},
	modalButtons: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
});
