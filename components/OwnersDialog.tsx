import { colors } from "@/constants/colors";
import { useSupabase } from "@/context/supabase-provider";
import { useOrganizationOwners } from "@/hooks/useOrganizationOwners";
import { Tables } from "@/lib/database.types";
import { useColorScheme } from "@/lib/useColorScheme";
import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { Dialog, Divider, List, Portal, TextInput } from "react-native-paper";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { H4 } from "./ui/typography";

type OwnersDialogProps = {
	visible: boolean;
	onDismiss: () => void;
};

export const OwnersDialog = ({ visible, onDismiss }: OwnersDialogProps) => {
	const { colorScheme } = useColorScheme();
	const [newOwnerName, setNewOwnerName] = useState("");
	const [error, setError] = useState("");
	const { activeOrganization } = useSupabase();
	const { owners, isLoading, stoneCounts, addOwner, deleteOwner } =
		useOrganizationOwners();

	const handleAddOwner = async () => {
		if (!newOwnerName.trim()) {
			setError("Please enter a name");
			return;
		}

		try {
			setError("");
			await addOwner.mutateAsync(newOwnerName);
			setNewOwnerName("");
		} catch (err: any) {
			setError(err.message || "Failed to add owner");
		}
	};

	const handleDeleteOwner = (owner: Tables<"organization_owners">) => {
		// Check if owner has stones
		const stoneCount = stoneCounts[owner.name] || 0;

		if (stoneCount > 0) {
			Alert.alert(
				"Owner has stones",
				`This owner has ${stoneCount} stone${stoneCount === 1 ? "" : "s"}. Are you sure you want to remove them?`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Remove",
						style: "destructive",
						onPress: () => confirmDeleteOwner(owner),
					},
				],
			);
		} else {
			confirmDeleteOwner(owner);
		}
	};

	const confirmDeleteOwner = async (owner: Tables<"organization_owners">) => {
		try {
			await deleteOwner.mutateAsync(owner.id);
		} catch (err: any) {
			Alert.alert("Error", err.message || "Failed to delete owner");
		}
	};

	const backgroundColor =
		colorScheme === "dark" ? colors.dark.card : colors.light.card;

	return (
		<Portal>
			<Dialog
				visible={visible}
				onDismiss={onDismiss}
				style={[styles.dialog, { backgroundColor }]}
			>
				<Dialog.Title>
					<View className="flex justify-center items-center gap-2 w-full">
						<H4 className="text-center">Manage Owners for</H4>
						<H4 className="text-center">{activeOrganization?.name}</H4>
					</View>
				</Dialog.Title>
				<Dialog.Content>
					<View style={styles.content}>
						{isLoading ? (
							<View style={styles.loadingContainer}>
								<Text>Loading owners...</Text>
							</View>
						) : owners.length === 0 ? (
							<View style={styles.emptyContainer}>
								<Text>No owners added yet</Text>
							</View>
						) : (
							<FlatList
								data={owners}
								keyExtractor={(item) => item.id}
								style={styles.list}
								renderItem={({ item }) => (
									<List.Item
										title={item.name}
										className="bg-gray-100"
										description={`${stoneCounts[item.name] || 0} stone${stoneCounts[item.name] !== 1 ? "s" : ""}`}
										right={(props) => (
											<Button
												variant="outline"
												size="sm"
												onPress={() => handleDeleteOwner(item)}
											>
												<Text>Remove</Text>
											</Button>
										)}
									/>
								)}
								ItemSeparatorComponent={() => <Divider />}
							/>
						)}

						<View style={styles.addOwnerSection}>
							<H4>Add New Owner</H4>
							<TextInput
								label="Owner Name"
								defaultValue={newOwnerName}
								onChangeText={setNewOwnerName}
								mode="outlined"
								style={styles.input}
							/>
							{error ? <Text style={styles.errorText}>{error}</Text> : null}
							<Button
								className="w-full mt-2"
								variant="default"
								onPress={handleAddOwner}
								disabled={addOwner.isPending}
							>
								<Text>{addOwner.isPending ? "Adding..." : "Add Owner"}</Text>
							</Button>
						</View>
					</View>
				</Dialog.Content>
				<Dialog.Actions>
					<Button variant="ghost" onPress={onDismiss}>
						<Text>Close</Text>
					</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	dialog: {
		borderRadius: 8,
	},
	content: {
		gap: 4,
	},
	list: {
		maxHeight: 300,
		marginTop: 8,
	},
	loadingContainer: {
		padding: 16,
		alignItems: "center",
	},
	emptyContainer: {
		padding: 16,
		alignItems: "center",
	},
	addOwnerSection: {
		marginTop: 16,
	},
	input: {
		marginTop: 8,
	},
	errorText: {
		color: "red",
		marginTop: 4,
	},
});
