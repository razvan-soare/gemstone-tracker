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
import {
	View,
	StyleSheet,
	ToastAndroid,
	Platform,
	Pressable,
} from "react-native";
import { List, Modal, Portal, TextInput, Snackbar } from "react-native-paper";
import { Pencil, Trash2 } from "lucide-react-native";
import { Dropdown } from "react-native-paper-dropdown";
import { createOrganizationWithDefaults } from "@/utils/organization/createOrganizationDefaults";
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
import { useCreateOrganization } from "@/hooks/useCreateOrganization";
import { supabase } from "@/config/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { DeleteOrganizationDialog } from "@/components/DeleteOrganizationDialog";

export default function Organizations() {
	const [orgName, setOrgName] = useState("");
	const [orgNameError, setOrgNameError] = useState("");
	const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
	const [ownersDialogVisible, setOwnersDialogVisible] = useState(false);
	const [inviteModalVisible, setInviteModalVisible] = useState(false);
	const [gemstoneTypesDialogVisible, setGemstoneTypesDialogVisible] =
		useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteError, setInviteError] = useState("");
	const [shapesDialogVisible, setShapesDialogVisible] = useState(false);
	const [colorsDialogVisible, setColorsDialogVisible] = useState(false);
	const [newOrgModalVisible, setNewOrgModalVisible] = useState(false);
	const [newOrgName, setNewOrgName] = useState("");
	const [newOrgError, setNewOrgError] = useState("");
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [isSuccess, setIsSuccess] = useState(false);
	const [deleteOrgDialogVisible, setDeleteOrgDialogVisible] = useState(false);
	const [organizationToRemove, setOrganizationToRemove] = useState<
		string | null
	>(null);
	const queryClient = useQueryClient();
	const updateOrganization = useUpdateOrganization();
	const createOrganization = useCreateOrganization();
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
		if (!orgName || !editingOrgId) {
			setOrgNameError("Please enter a valid organization name");
			return;
		}

		try {
			setOrgNameError("");
			const updatedOrg = await updateOrganization.mutateAsync({
				organizationId: editingOrgId,
				name: orgName,
			});

			// If updating the active organization, update it directly
			if (updatedOrg && activeOrganization?.id === editingOrgId) {
				updateActiveOrganization(updatedOrg);
			}

			// Refresh data
			queryClient.invalidateQueries({ queryKey: ["organizations"] });
			queryClient.invalidateQueries({ queryKey: ["organization_members"] });

			// Show success message
			showMessage(`Organization name updated to "${orgName}"`, true);

			closeOrgNameDialog();
			setEditingOrgId(null);
		} catch (error: any) {
			setOrgNameError(error.message || "Failed to update organization name");
			showMessage(error.message || "Failed to update organization name", false);
		}
	};

	// Handle creating a new organization
	const handleCreateOrganization = async () => {
		if (!newOrgName || !user?.id) {
			setNewOrgError("Please enter a valid organization name");
			return;
		}

		try {
			setNewOrgError("");

			const newOrg = await createOrganizationWithDefaults(
				supabase,
				{
					name: newOrgName,
					user_id: user.id,
				},
				queryClient,
			);

			if (newOrg) {
				await onSelectOrganization(newOrg.id);
				setNewOrgModalVisible(false);
				setNewOrgName("");
				showMessage(`Organization "${newOrg.name}" created successfully`);
			} else {
				throw new Error("Failed to create organization");
			}
		} catch (error: any) {
			console.error("Error creating organization:", error);
			setNewOrgError(error.message || "Failed to create organization");
			showMessage(error.message || "Failed to create organization", false);
		}
	};

	// Show a success or error message
	const showMessage = (message: string, success: boolean = true) => {
		setSnackbarMessage(message);
		setIsSuccess(success);
		setSnackbarVisible(true);

		// Also show a toast on Android for better visibility
		if (Platform.OS === "android") {
			ToastAndroid.show(message, ToastAndroid.SHORT);
		}
	};

	// Handle initiating organization removal
	const handleRemoveOrganization = (organizationId: string) => {
		// Find the organization to show its name in the confirmation
		const organizationToDelete = userOrganizations.find(
			(org) => org.id === organizationId,
		);
		if (!organizationToDelete) return;

		// Don't allow removing the active organization if it's the only one
		if (userOrganizations.length === 1) {
			showMessage("You cannot remove your only organization", false);
			return;
		}

		setOrganizationToRemove(organizationId);
		setDeleteOrgDialogVisible(true);
	};

	if (userOrganizations.length === 0) {
		return (
			<View className="p-4 bg-white h-full flex gap-y-8">
				<H3>No Organizations</H3>
				<Muted>You don't have any organizations yet.</Muted>
				<Button
					className="w-full mt-4"
					size="default"
					variant="default"
					onPress={() => setNewOrgModalVisible(true)}
				>
					<Text>Create New Organization</Text>
				</Button>

				{/* New Organization Modal */}
				<Portal>
					<Modal
						visible={newOrgModalVisible}
						onDismiss={() => {
							setNewOrgModalVisible(false);
							setNewOrgName("");
							setNewOrgError("");
						}}
						contentContainerStyle={[
							styles.modalContainer,
							{
								backgroundColor:
									colorScheme === "dark" ? colors.dark.card : colors.light.card,
							},
						]}
					>
						<H3>Create New Organization</H3>
						<Muted>Enter a name for your new organization</Muted>

						<TextInput
							label="Organization Name"
							onChangeText={setNewOrgName}
							mode="outlined"
							style={styles.input}
							autoCapitalize="words"
						/>

						{newOrgError ? (
							<Text style={styles.errorText}>{newOrgError}</Text>
						) : null}

						<View style={styles.modalButtons}>
							<Button
								variant="ghost"
								onPress={() => {
									setNewOrgModalVisible(false);
									setNewOrgName("");
									setNewOrgError("");
								}}
							>
								<Text>Cancel</Text>
							</Button>
							<Button
								variant="default"
								onPress={handleCreateOrganization}
								disabled={createOrganization.isPending}
							>
								<Text>
									{createOrganization.isPending ? "Creating..." : "Create"}
								</Text>
							</Button>
						</View>
					</Modal>
				</Portal>

				{/* Success/Error Snackbar */}
				<Snackbar
					visible={snackbarVisible}
					onDismiss={() => setSnackbarVisible(false)}
					duration={3000}
					style={{
						backgroundColor: isSuccess ? "#43a047" : "#d32f2f",
					}}
					action={{
						label: "Dismiss",
						onPress: () => setSnackbarVisible(false),
					}}
				>
					{snackbarMessage}
				</Snackbar>
			</View>
		);
	}

	return (
		<View className="p-4 bg-white h-full flex gap-y-8">
			<View className="flex gap-4">
				<H3>Organization</H3>
				<View className="flex gap-2">
					{userOrganizations.map((org) => (
						<View
							key={org.id}
							className={`p-3 rounded-md border border-gray-200 flex-row justify-between items-center ${
								activeOrganization?.id === org.id ? "bg-blue-50" : ""
							}`}
						>
							<Pressable
								className="flex-1"
								style={({ pressed }) => [
									pressed && styles.activeOrgNamePressed,
									{ borderRadius: 4 },
								]}
								onPress={() => {
									setOrgName(org.name);
									setEditingOrgId(org.id);
									openOrgNameDialog();
								}}
							>
								<View className="flex-row items-center p-1 gap-2">
									<Pencil size={14} color="#666" />
									<Text className="font-medium flex-1">{org.name}</Text>
								</View>
							</Pressable>

							<View className="flex-row gap-4">
								{activeOrganization?.id !== org.id ? (
									<Button
										size="sm"
										variant="outline"
										onPress={() => onSelectOrganization(org.id)}
									>
										<Text>Select</Text>
									</Button>
								) : (
									<View className="bg-blue-100 px-3 py-0.5 rounded flex items-center justify-center">
										<Text className="text-blue-600  font-medium">Active</Text>
									</View>
								)}
								<Button
									size="sm"
									variant="destructive"
									disabled={activeOrganization?.id === org.id}
									onPress={() => handleRemoveOrganization(org.id)}
								>
									<Trash2 size={16} color="white" />
								</Button>
							</View>
						</View>
					))}
				</View>

				<View className="flex flex-row gap-2">
					<Button
						className="flex-1"
						size="default"
						variant="default"
						onPress={() => setNewOrgModalVisible(true)}
					>
						<Text>New Organization</Text>
					</Button>
					<Button
						className="flex-1"
						size="default"
						variant="outline"
						onPress={() => setOwnersDialogVisible(true)}
					>
						<Text>Manage Owners</Text>
					</Button>
				</View>
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
						setEditingOrgId(null);
					}}
					contentContainerStyle={[
						{
							padding: 20,
							margin: 20,
							borderRadius: 8,
							display: "flex",
							flexDirection: "column",
							gap: 10,
							backgroundColor:
								colorScheme === "dark" ? colors.dark.card : colors.light.card,
						},
					]}
				>
					<H3>Edit Organization Name</H3>

					<TextInput
						label="Organization Name"
						defaultValue={orgName}
						onChangeText={setOrgName}
						mode="outlined"
						className="mt-4 mb-2"
						autoCapitalize="words"
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
								setEditingOrgId(null);
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

			{/* New Organization Modal */}
			<Portal>
				<Modal
					visible={newOrgModalVisible}
					onDismiss={() => {
						setNewOrgModalVisible(false);
						setNewOrgName("");
						setNewOrgError("");
					}}
					contentContainerStyle={[
						styles.modalContainer,
						{
							backgroundColor:
								colorScheme === "dark" ? colors.dark.card : colors.light.card,
						},
					]}
				>
					<H3>Create New Organization</H3>
					<Muted>Enter a name for your new organization</Muted>

					<TextInput
						label="Organization Name"
						defaultValue={newOrgName}
						onChangeText={setNewOrgName}
						mode="outlined"
						style={styles.input}
						autoCapitalize="words"
					/>

					{newOrgError ? (
						<Text style={styles.errorText}>{newOrgError}</Text>
					) : null}

					<View style={styles.modalButtons}>
						<Button
							variant="ghost"
							onPress={() => {
								setNewOrgModalVisible(false);
								setNewOrgName("");
								setNewOrgError("");
							}}
						>
							<Text>Cancel</Text>
						</Button>
						<Button
							variant="default"
							onPress={handleCreateOrganization}
							disabled={createOrganization.isPending}
						>
							<Text>
								{createOrganization.isPending ? "Creating..." : "Create"}
							</Text>
						</Button>
					</View>
				</Modal>
			</Portal>

			{/* Enhanced Delete Organization Dialog */}
			<DeleteOrganizationDialog
				visible={deleteOrgDialogVisible}
				onDismiss={() => {
					setDeleteOrgDialogVisible(false);
					setOrganizationToRemove(null);
				}}
				organizationId={organizationToRemove ?? ""}
			/>

			{/* Success/Error Snackbar */}
			<Snackbar
				visible={snackbarVisible}
				onDismiss={() => setSnackbarVisible(false)}
				duration={3000}
				style={{
					backgroundColor: isSuccess ? "#43a047" : "#d32f2f",
				}}
				action={{
					label: "Dismiss",
					onPress: () => setSnackbarVisible(false),
				}}
			>
				{snackbarMessage}
			</Snackbar>
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
	activeOrgName: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	activeOrgNamePressed: {
		backgroundColor: "rgba(59, 130, 246, 0.1)",
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
