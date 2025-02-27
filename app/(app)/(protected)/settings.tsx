import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-paper-dropdown";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2, Muted } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import { Tables } from "@/lib/database.types";

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
			<View className="flex-1 p-4 gap-y-8">
				<View className="gap-y-8">
					<H1>Settings</H1>

					{userOrganizations.length > 0 && (
						<View className="gap-y-2">
							<H2>Organization</H2>
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
	dropdownContainer: {
		marginTop: 8,
	},
});
