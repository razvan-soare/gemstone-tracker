import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H3, Muted } from "@/components/ui/typography";
import { useSupabase } from "@/context/supabase-provider";
import { useDialog } from "@/hooks/useDialog";
import {
	useOrganizationMemberships,
	useUpdateOrganization,
} from "@/hooks/useOrganizationMemberships";
import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { List, Modal, Portal, TextInput } from "react-native-paper";

import { Dropdown } from "react-native-paper-dropdown";

import { ColorsDialog } from "@/components/ColorsDialog";
import { GemstoneTypesDialog } from "@/components/GemstoneTypesDialog";
import { OwnersDialog } from "@/components/OwnersDialog";
import { ShapesDialog } from "@/components/ShapesDialog";
import { colors } from "@/constants/colors";
import {
	useAcceptInvitation,
	useCheckPendingInvitations,
	useCreateInvitation,
	useDeclineInvitation,
	useDeleteInvitation,
	useOrganizationInvitations,
} from "@/hooks/useInvitations";
import { Tables } from "@/lib/database.types";
import { useColorScheme } from "@/lib/useColorScheme";

export default function Organizations() {
	const [orgName, setOrgName] = useState("");
	const [orgNameError, setOrgNameError] = useState("");
	const [ownersDialogVisible, setOwnersDialogVisible] = useState(false);
	const [inviteModalVisible, setInviteModalVisible] = useState(false);
	const [gemstoneTypesDialogVisible, setGemstoneTypesDialogVisible] =
		useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteError, setInviteError] = useState("");
	const [shapesDialogVisible, setShapesDialogVisible] = useState(false);
	const [colorsDialogVisible, setColorsDialogVisible] = useState(false);
	const updateOrganization = useUpdateOrganization();
	const { colorScheme, toggleColorScheme } = useColorScheme();
	const {
		activeOrganization,
		userOrganizations,
		onSelectOrganization,
		updateActiveOrganization,
		user,
		session,
	} = useSupabase();
	const {
		open: orgNameDialogOpen,
		onOpen: openOrgNameDialog,
		onClose: closeOrgNameDialog,
		key: orgNameDialogKey,
	} = useDialog();

	// Get organization memberships to check if user is owner
	const { data: organizationMemberships = [] } =
		useOrganizationMemberships(session);
	const isOrgOwner = organizationMemberships.some(
		(membership) =>
			membership.organization_id === activeOrganization?.id &&
			membership.user_id === user?.id &&
			membership.role === "owner",
	);

	// Get pending invitations for the active organization
	const { data: orgPendingInvitations = [], refetch: refetchInvitations } =
		useOrganizationInvitations(activeOrganization?.id || null);
	const { data: pendingInvitations, refetch: refetchPendingInvitations } =
		useCheckPendingInvitations(user?.email || "");

	// Mutations for invitations
	const createInvitation = useCreateInvitation();
	const deleteInvitation = useDeleteInvitation();
	const acceptInvitation = useAcceptInvitation();
	const declineInvitation = useDeclineInvitation();

	const refetchAllInvitations = () => {
		refetchInvitations();
		refetchPendingInvitations();
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
			await declineInvitation.mutateAsync({ invitationId: invitation.id });
			refetchAllInvitations();
		} catch (error) {
			console.error("Error accepting invitation:", error);
		}
	};

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

	// Open organization name edit modal
	const openOrgNameModal = () => {
		if (activeOrganization) {
			setOrgName(activeOrganization.name);
			openOrgNameDialog();
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
			const updatedOrg = await updateOrganization.mutateAsync({
				organizationId: activeOrganization.id,
				name: orgName,
			});

			// Update the active organization with the updated name
			if (updatedOrg) {
				// Update the active organization directly
				updateActiveOrganization(updatedOrg);
			}

			closeOrgNameDialog();
		} catch (error: any) {
			setOrgNameError(error.message || "Failed to update organization name");
		}
	};

	if (userOrganizations.length === 0) {
		return (
			<View>
				<Text>No organizations found</Text>
			</View>
		);
	}

	return (
		<View className="p-4 bg-white h-full flex gap-y-8">
			<View className="flex gap-2">
				<H3>Organization</H3>
				<View>
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

				<Button
					className="w-full mt-2"
					size="default"
					variant="outline"
					onPress={openOrgNameModal}
				>
					<Text>Edit Organization Name</Text>
				</Button>
				<Button
					className="w-full mt-2"
					size="default"
					variant="outline"
					onPress={() => setOwnersDialogVisible(true)}
				>
					<Text>Manage Owners</Text>
				</Button>
			</View>
			<View className="flex gap-2">
				<H3>Team Members</H3>
				<Button
					className="w-full"
					size="default"
					variant="outline"
					onPress={() => setInviteModalVisible(true)}
				>
					<Text>Invite User</Text>
				</Button>
				<View>
					{pendingInvitations && pendingInvitations.length > 0 && (
						<View className="mt-2">
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
			</View>

			<View className="flex gap-2">
				<H3>Gemstone Attributes</H3>

				<View className="flex-row flex-wrap gap-2 mt-2">
					<Button
						size="default"
						variant="outline"
						onPress={() => setGemstoneTypesDialogVisible(true)}
						className="flex-1 min-w-[110px] justify-center"
					>
						<Text>Gemstone Types</Text>
					</Button>
					<Button
						size="default"
						variant="outline"
						onPress={() => setShapesDialogVisible(true)}
						className="flex-1 min-w-[110px] justify-center"
					>
						<Text>Shapes</Text>
					</Button>
					<Button
						size="default"
						variant="outline"
						onPress={() => setColorsDialogVisible(true)}
						className="flex-1 min-w-[110px] justify-center"
					>
						<Text>Colors</Text>
					</Button>
				</View>
			</View>

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
					key={orgNameDialogKey}
					visible={orgNameDialogOpen}
					onDismiss={() => {
						closeOrgNameDialog();
						setOrgName("");
						setOrgNameError("");
					}}
					contentContainerStyle={[
						{
							padding: 20,
							margin: 20,
							borderRadius: 8,
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
						className="mt-4 mb-2"
					/>

					{orgNameError ? (
						<Text className="text-red-500 mb-2">{orgNameError}</Text>
					) : null}

					<View className="flex-row justify-between">
						<Button
							variant="ghost"
							onPress={() => {
								closeOrgNameDialog();
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

			{/* Owners Dialog */}
			<OwnersDialog
				visible={ownersDialogVisible}
				onDismiss={() => setOwnersDialogVisible(false)}
			/>

			{/* Gemstone Types Dialog */}
			<GemstoneTypesDialog
				visible={gemstoneTypesDialogVisible}
				onDismiss={() => setGemstoneTypesDialogVisible(false)}
			/>

			{/* Shapes Dialog */}
			<ShapesDialog
				visible={shapesDialogVisible}
				onDismiss={() => setShapesDialogVisible(false)}
			/>

			{/* Colors Dialog */}
			<ColorsDialog
				visible={colorsDialogVisible}
				onDismiss={() => setColorsDialogVisible(false)}
			/>
		</View>
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
