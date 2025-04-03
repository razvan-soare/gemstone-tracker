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
import { useLanguage } from "@/hooks/useLanguage";
import { useOrganizationMemberships } from "@/hooks/useOrganizationMemberships";
import { useColorScheme } from "@/lib/useColorScheme";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

export default function Settings() {
	const {
		signOut,
		activeOrganization,
		onSelectOrganization,
		userOrganizations,
		session,
	} = useSupabase();
	const { colorScheme, toggleColorScheme } = useColorScheme();
	const { columnCount, updateColumnCount } = useColumnPreference();
	const { t, currentLanguage, changeLanguage, availableLanguages } =
		useLanguage();

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
						<H2>{t("settings.title")}</H2>
					</View>

					{userOrganizations.length > 0 && (
						<View className="gap-y-2">
							<H3>{t("settings.organization.title")}</H3>
							<View>
								<Dropdown
									label={t("settings.organization.select")}
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

							<Button
								className="w-full mt-2"
								size="default"
								variant="outline"
								onPress={() => router.push("/(app)/organizations")}
							>
								<Text>{t("settings.organization.manage")}</Text>
							</Button>
						</View>
					)}

					<View className="gap-y-2">
						<H3>{t("settings.appPreferences")}</H3>
						<Muted>{t("settings.customizeAppearance")}</Muted>

						<View className="flex-row flex-wrap gap-2 mt-2">
							<View className="flex-1 min-w-[120px]">
								<Dropdown
									label={t("settings.theme.title")}
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
										{ label: t("settings.theme.light"), value: "light" },
										{ label: t("settings.theme.dark"), value: "dark" },
									]}
								/>
							</View>

							<View className="flex-1 min-w-[120px]">
								<Dropdown
									label={t("settings.columns.title")}
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
										label: `${count} ${t(count > 1 ? "settings.columns.columns" : "settings.columns.column")}`,
										value: count.toString(),
									}))}
								/>
							</View>

							<View className="flex-1 min-w-[120px]">
								<Dropdown
									label={t("settings.language.title")}
									mode="outlined"
									hideMenuHeader
									menuContentStyle={{ top: 60 }}
									value={currentLanguage}
									onSelect={(value) => {
										if (!value) return;
										changeLanguage(value as "en" | "zh");
									}}
									options={availableLanguages.map((lang) => ({
										label: lang.name,
										value: lang.code,
									}))}
								/>
							</View>
						</View>
					</View>

					<View className="gap-y-2">
						<H3>{t("settings.account.title")}</H3>
						<Muted>{t("settings.account.signOutDescription")}</Muted>
						<Button
							className="w-full"
							size="default"
							variant="destructive"
							onPress={signOut}
						>
							<Text>{t("auth.signOut")}</Text>
						</Button>
					</View>
				</View>

				{/* App Info Section */}
				<View className="gap-y-2 mt-4">
					<H3>{t("settings.appInfo.title")}</H3>

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
							{t("settings.appInfo.build")}:{" "}
							{Constants.expoConfig?.ios?.buildNumber || "Unknown"}
						</Text>
					</Pressable>
				</View>

				{/* Developer Options - Only shown after activating */}
				{showDevOptions && (
					<View className="gap-y-2 mt-4 border-t border-gray-200 pt-4">
						<H3>{t("settings.developer.title")}</H3>
						<Muted>{t("settings.developer.description")}</Muted>

						<Button
							className="w-full mt-2"
							size="default"
							variant="outline"
							onPress={() => router.push("/debug")}
						>
							<Text>{t("settings.developer.debugTools")}</Text>
						</Button>

						<Button
							className="w-full mt-2"
							size="default"
							variant="outline"
							onPress={() => setShowDevOptions(false)}
						>
							<Text>{t("settings.developer.hideOptions")}</Text>
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
