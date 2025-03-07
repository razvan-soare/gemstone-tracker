import { useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { List, Modal, Portal, TextInput } from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H2, H3, Muted } from "@/components/ui/typography";
import { colors } from "@/constants/colors";
import { useSupabase } from "@/context/supabase-provider";
import {
	useAcceptInvitation,
	useCheckPendingInvitations,
	useCreateInvitation,
	useDeclineInvitation,
	useDeleteInvitation,
	useOrganizationInvitations,
} from "@/hooks/useInvitations";
import {
	useOrganizationMemberships,
	useUpdateOrganization,
} from "@/hooks/useOrganizationMemberships";
import { Tables } from "@/lib/database.types";
import { useColorScheme } from "@/lib/useColorScheme";

export default function Settings() {
	const {
		signOut,
		activeOrganization,
		userOrganizations,
		onSelectOrganization,
		user,
		session,
	} = useSupabase();
	const { colorScheme, toggleColorScheme } = useColorScheme();
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteModalVisible, setInviteModalVisible] = useState(false);
	const [inviteError, setInviteError] = useState("");
	const [orgNameModalVisible, setOrgNameModalVisible] = useState(false);
	const [orgName, setOrgName] = useState("");
	const [orgNameError, setOrgNameError] = useState("");

	// Get pending invitations for the active organization
	const { data: orgPendingInvitations = [], refetch: refetchInvitations } =
		useOrganizationInvitations(activeOrganization?.id || null);
	const { data: pendingInvitations, refetch: refetchPendingInvitations } =
		useCheckPendingInvitations(user?.email || "");

	// Get organization memberships to check if user is owner
	const { data: organizationMemberships = [] } =
		useOrganizationMemberships(session);
	const isOrgOwner = organizationMemberships.some(
		(membership) =>
			membership.organization_id === activeOrganization?.id &&
			membership.user_id === user?.id &&
			membership.role === "owner",
	);

	const refetchAllInvitations = () => {
		refetchInvitations();
		refetchPendingInvitations();
	};

	// Mutations for invitations
	const createInvitation = useCreateInvitation();
	const deleteInvitation = useDeleteInvitation();
	const acceptInvitation = useAcceptInvitation();
	const declineInvitation = useDeclineInvitation();
	const updateOrganization = useUpdateOrganization();

	// Handle sending an invitation
	const handleSendInvite = async () => {
		if (!inviteEmail || !activeOrganization?.id || !user?.id) {
			setInviteError("Please enter a valid email address");
			return;
		}

		try {
			setInviteError("");
			await createInvitation.mutateAsync({ email: inviteEmail });
			setInviteEmail("");
			setInviteModalVisible(false);
			refetchAllInvitations();
		} catch (error: any) {
			setInviteError(error.message || "Failed to send invitation");
		}
	};

	// Handle canceling an invitation
	const handleCancelInvite = async (invitation: Tables<"invitations">) => {
		if (!activeOrganization?.id) return;

		try {
			await deleteInvitation.mutateAsync({ invitationId: invitation.id });
			refetchAllInvitations();
		} catch (error) {
			console.error("Error canceling invitation:", error);
		}
	};

	const handleAcceptInvite = async (invitation: Tables<"invitations">) => {
		if (!activeOrganization?.id) return;

		try {
			await acceptInvitation.mutateAsync({ invitation });
			refetchAllInvitations();
		} catch (error) {
			console.error("Error accepting invitation:", error);
		}
	};
	const handleDeclineInvite = async (invitation: Tables<"invitations">) => {
		if (!activeOrganization?.id) return;

		try {
			await declineInvitation.mutateAsync({
				invitationId: invitation.id,
			});
			refetchAllInvitations();
		} catch (error) {
			console.error("Error accepting invitation:", error);
		}
	};

	// Handle updating organization name
	const handleUpdateOrgName = async () => {
		if (!orgName || !activeOrganization?.id) {
			setOrgNameError("Please enter a valid organization name");
			return;
		}

		try {
			setOrgNameError("");
			await updateOrganization.mutateAsync({
				organizationId: activeOrganization.id,
				name: orgName,
			});
			setOrgNameModalVisible(false);
		} catch (error: any) {
			setOrgNameError(error.message || "Failed to update organization name");
		}
	};

	// Open organization name edit modal
	const openOrgNameModal = () => {
		if (activeOrganization) {
			setOrgName(activeOrganization.name);
			setOrgNameModalVisible(true);
		}
	};

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
							{isOrgOwner && activeOrganization && (
								<Button
									className="w-full mt-2"
									size="default"
									variant="outline"
									onPress={openOrgNameModal}
								>
									<Text>Edit Organization Name</Text>
								</Button>
							)}
						</View>
					)}

					{activeOrganization && (
						<View className="gap-y-2">
							<H3>Team Members</H3>
							<Muted>Invite people to join your organization</Muted>
							<Button
								className="w-full"
								size="default"
								variant="outline"
								onPress={() => setInviteModalVisible(true)}
							>
								<Text>Invite User</Text>
							</Button>

							{pendingInvitations && pendingInvitations.length > 0 && (
								<View style={styles.membersCard}>
									<List.Section>
										<List.Subheader>Pending Invitations</List.Subheader>
										{pendingInvitations.map((invitation) => (
											<List.Item
												key={invitation.id}
												title={`${invitation.organization_name} invited you to join`}
												description="Pending"
												style={styles.listItem}
												titleStyle={styles.listItemTitle}
												descriptionStyle={styles.listItemDescription}
												right={() => (
													<View className="flex-row gap-x-2">
														<Button
															size="sm"
															variant="ghost"
															onPress={() => handleAcceptInvite(invitation)}
														>
															<Text>Accept</Text>
														</Button>
														<Button
															size="sm"
															variant="ghost"
															onPress={() => handleCancelInvite(invitation)}
														>
															<Text>Decline</Text>
														</Button>
													</View>
												)}
											/>
										))}
									</List.Section>
								</View>
							)}
							{orgPendingInvitations.length > 0 && (
								<View style={styles.membersCard}>
									<List.Section>
										<List.Subheader>Invitations Sent</List.Subheader>
										{orgPendingInvitations.map((invitation) => (
											<List.Item
												key={invitation.id}
												title={invitation.email || ""}
												description="Pending"
												style={styles.listItem}
												titleStyle={styles.listItemTitle}
												descriptionStyle={styles.listItemDescription}
												right={() => (
													<Button
														size="sm"
														variant="ghost"
														onPress={() => handleCancelInvite(invitation)}
													>
														<Text>Cancel</Text>
													</Button>
												)}
											/>
										))}
									</List.Section>
								</View>
							)}
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

			{/* Invite User Modal */}
			<Portal>
				<Modal
					visible={inviteModalVisible}
					onDismiss={() => {
						setInviteModalVisible(false);
						setInviteEmail("");
						setInviteError("");
					}}
					contentContainerStyle={[
						styles.modalContainer,
						{
							backgroundColor:
								colorScheme === "dark" ? colors.dark.card : colors.light.card,
						},
					]}
				>
					<H3>Invite User</H3>
					<Muted>
						Enter the email address of the person you want to invite
					</Muted>

					<TextInput
						label="Email"
						onChangeText={setInviteEmail}
						mode="outlined"
						style={styles.input}
						keyboardType="email-address"
						autoCapitalize="none"
					/>

					{inviteError ? (
						<Text style={styles.errorText}>{inviteError}</Text>
					) : null}

					<View style={styles.modalButtons}>
						<Button
							variant="ghost"
							onPress={() => {
								setInviteModalVisible(false);
								setInviteEmail("");
								setInviteError("");
							}}
						>
							<Text>Cancel</Text>
						</Button>
						<Button
							variant="default"
							onPress={handleSendInvite}
							disabled={createInvitation.isPending}
						>
							<Text>
								{createInvitation.isPending ? "Sending..." : "Send Invite"}
							</Text>
						</Button>
					</View>
				</Modal>
			</Portal>

			{/* Edit Organization Name Modal */}
			<Portal>
				<Modal
					visible={orgNameModalVisible}
					onDismiss={() => {
						setOrgNameModalVisible(false);
						setOrgName("");
						setOrgNameError("");
					}}
					contentContainerStyle={[
						styles.modalContainer,
						{
							backgroundColor:
								colorScheme === "dark" ? colors.dark.card : colors.light.card,
						},
					]}
				>
					<H3>Edit Organization Name</H3>
					<Muted>Enter a new name for your organization</Muted>

					<TextInput
						label="Organization Name"
						defaultValue={orgName}
						onChangeText={setOrgName}
						mode="outlined"
						style={styles.input}
					/>

					{orgNameError ? (
						<Text style={styles.errorText}>{orgNameError}</Text>
					) : null}

					<View style={styles.modalButtons}>
						<Button
							variant="ghost"
							onPress={() => {
								setOrgNameModalVisible(false);
								setOrgName("");
								setOrgNameError("");
							}}
						>
							<Text>Cancel</Text>
						</Button>
						<Button
							variant="default"
							onPress={handleUpdateOrgName}
							disabled={updateOrganization.isPending}
						>
							<Text>
								{updateOrganization.isPending ? "Updating..." : "Update Name"}
							</Text>
						</Button>
					</View>
				</Modal>
			</Portal>
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
