import React, { useState } from "react";
import { StyleSheet, View, FlatList, Alert } from "react-native";
import { Dialog, Portal, TextInput, List, Divider } from "react-native-paper";
import { Tables } from "@/lib/database.types";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { H3, Muted } from "./ui/typography";
import { useOrganizationOwners } from "@/hooks/useOrganizationOwners";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

type OwnersDialogProps = {
	visible: boolean;
	onDismiss: () => void;
};

export const OwnersDialog = ({ visible, onDismiss }: OwnersDialogProps) => {
	const { colorScheme } = useColorScheme();
	const [newOwnerName, setNewOwnerName] = useState("");
	const [error, setError] = useState("");

	const {
		owners,
		isLoading,
		stoneCounts,
		isLoadingStoneCounts,
		addOwner,
		deleteOwner,
	} = useOrganizationOwners();

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
				<Dialog.Title>Manage Owners</Dialog.Title>
				<Dialog.Content>
					<View style={styles.content}>
						<Muted>Manage the list of owners for your gemstones</Muted>

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
										description={`${stoneCounts[item.name] || 0} stone${stoneCounts[item.name] !== 1 ? "s" : ""}`}
										right={(props) => (
											<Button
												variant="ghost"
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
							<H3>Add New Owner</H3>
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
		padding: 10,
		margin: 20,
		borderRadius: 8,
	},
	content: {
		gap: 16,
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
