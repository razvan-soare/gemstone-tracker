import { useEffect, useState } from "react";
import {
	SafeAreaView,
	StyleSheet,
	View,
	FlatList,
	Alert,
	ScrollView,
} from "react-native";
import { Dropdown } from "react-native-paper-dropdown";
import {
	Card,
	TextInput,
	List,
	IconButton,
	Modal,
	Portal,
	Divider,
} from "react-native-paper";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H2, H3, Muted, P } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";
import { useColorScheme } from "@/lib/useColorScheme";
import { colors } from "@/constants/colors";
import { Tables } from "@/lib/database.types";
import {
	useOrganizationMembers,
	useRemoveOrganizationMember,
	useIsOrganizationOwner,
} from "@/hooks/useOrganizationMembers";

export default function Settings() {
	const {
		signOut,
		activeOrganization,
		userOrganizations,
		onSelectOrganization,
		user,
	} = useSupabase();
	const { colorScheme, toggleColorScheme } = useColorScheme();
	const [inviteModalVisible, setInviteModalVisible] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteError, setInviteError] = useState<string | null>(null);

	// Get organization members
	const { data: organizationMembers = [], isLoading: isLoadingMembers } =
		useOrganizationMembers(activeOrganization?.id || null);

	// Check if current user is the owner
	const { data: isOwner = false } = useIsOrganizationOwner(
		activeOrganization?.id || null,
	);

	// Mutations for member management
	const { mutate: removeMember, isPending: isRemoving } =
		useRemoveOrganizationMember();

	// Reset error when modal is opened/closed
	useEffect(() => {
		setInviteError(null);
	}, [inviteModalVisible]);

	// Handle member removal
	const handleRemoveMember = (memberId: string) => {
		if (!activeOrganization?.id) return;

		Alert.alert(
			"Remove Member",
			"Are you sure you want to remove this member from the organization?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: () => {
						removeMember({
							memberId,
							organizationId: activeOrganization.id,
						});
					},
				},
			],
		);
	};

	// Custom list item renderer with reduced height
	const renderMemberItem = ({ item }: { item: any }) => (
		<>
			<List.Item
				title={item.email}
				titleStyle={styles.listItemTitle}
				description={`Role: ${item.role}`}
				descriptionStyle={styles.listItemDescription}
				style={styles.listItem}
				right={(props) =>
					isOwner && item.user_id !== user?.id ? (
						<IconButton
							{...props}
							icon="delete"
							size={20}
							onPress={() => handleRemoveMember(item.id)}
							disabled={isRemoving}
						/>
					) : null
				}
			/>
			<Divider />
		</>
	);

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

					{activeOrganization && (
						<View className="gap-y-2">
							<Muted>Members of {activeOrganization.name}</Muted>

							<Card style={styles.membersCard}>
								<Card.Content style={styles.cardContent}>
									<FlatList
										data={organizationMembers}
										keyExtractor={(item) => item.id}
										renderItem={renderMemberItem}
										ListEmptyComponent={() => (
											<View style={styles.emptyContainer}>
												<Text>No members found</Text>
											</View>
										)}
										scrollEnabled={false}
									/>
								</Card.Content>
							</Card>
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
