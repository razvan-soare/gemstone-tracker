import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-paper-dropdown";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2, H3, Muted } from "@/components/ui/typography";
import { colors } from "@/constants/colors";
import { useSupabase } from "@/context/supabase-provider";

import { useColorScheme } from "@/lib/useColorScheme";

export default function Settings() {
	const {
		signOut,
		activeOrganization,
		userOrganizations,
		onSelectOrganization,
	} = useSupabase();
	const { colorScheme, toggleColorScheme } = useColorScheme();

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
							<Muted>Select the active organization</Muted>
							<View style={styles.dropdownContainer}>
								<Dropdown
									label="Select Organization"
									mode="outlined"
									hideMenuHeader
									menuContentStyle={{ top: 60 }}
									value={activeOrganization?.id}
									onSelect={(orgId) => {
										if (!orgId) return;
										onSelectOrganization(orgId);
									}}
									options={userOrganizations.map((org) => ({
										label: org.name,
										value: org.id,
									}))}
								/>
							</View>
						</View>
					)}

					<View className="gap-y-2">
						<H3>Appearance</H3>
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
	dropdownContainer: {
		marginTop: 8,
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
