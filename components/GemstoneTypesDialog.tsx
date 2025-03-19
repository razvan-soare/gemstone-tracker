import React, { useState } from "react";
import { StyleSheet, View, FlatList, Alert } from "react-native";
import { Dialog, Portal, TextInput, List, Divider } from "react-native-paper";
import { Tables } from "@/lib/database.types";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { H3, Muted } from "./ui/typography";
import { useOrganizationGemstoneTypes } from "@/hooks/useOrganizationGemstoneTypes";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

type GemstoneTypesDialogProps = {
	visible: boolean;
	onDismiss: () => void;
};

export const GemstoneTypesDialog = ({
	visible,
	onDismiss,
}: GemstoneTypesDialogProps) => {
	const { colorScheme } = useColorScheme();
	const [newGemstoneTypeName, setNewGemstoneTypeName] = useState("");
	const [error, setError] = useState("");

	const {
		gemstoneTypes,
		isLoading,
		stoneCounts,
		isLoadingStoneCounts,
		addGemstoneType,
		deleteGemstoneType,
	} = useOrganizationGemstoneTypes();

	const handleAddGemstoneType = async () => {
		if (!newGemstoneTypeName.trim()) {
			setError("Please enter a name");
			return;
		}

		try {
			setError("");
			await addGemstoneType.mutateAsync(newGemstoneTypeName);
			setNewGemstoneTypeName("");
		} catch (err: any) {
			setError(err.message || "Failed to add gemstone type");
		}
	};

	const handleDeleteGemstoneType = (
		gemstoneType: Tables<"organization_gemstone_types">,
	) => {
		// Check if gemstone type has stones
		const stoneCount = stoneCounts[gemstoneType.name] || 0;

		if (stoneCount > 0) {
			Alert.alert(
				"Gemstone type has stones",
				`This gemstone type has ${stoneCount} stone${stoneCount === 1 ? "" : "s"}. Are you sure you want to remove it?`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Remove",
						style: "destructive",
						onPress: () => confirmDeleteGemstoneType(gemstoneType),
					},
				],
			);
		} else {
			confirmDeleteGemstoneType(gemstoneType);
		}
	};

	const confirmDeleteGemstoneType = async (
		gemstoneType: Tables<"organization_gemstone_types">,
	) => {
		try {
			await deleteGemstoneType.mutateAsync(gemstoneType.id);
		} catch (err: any) {
			Alert.alert("Error", err.message || "Failed to delete gemstone type");
		}
	};

	const backgroundColor =
		colorScheme === "dark" ? colors.dark.card : colors.light.card;

	return (
		<Portal>
			<Dialog
				visible={visible}
				onDismiss={onDismiss}
				style={{ backgroundColor }}
			>
				<Dialog.Title>
					<H3>Manage Gemstone Types</H3>
				</Dialog.Title>
				<Dialog.Content>
					<Muted>
						Add or remove gemstone types for your organization. These will be
						available in all gemstone forms and filters.
					</Muted>

					<View style={styles.inputContainer}>
						<TextInput
							label="New Gemstone Type"
							onChangeText={setNewGemstoneTypeName}
							style={styles.input}
							error={!!error}
						/>
						<Button
							size="sm"
							variant="default"
							onPress={handleAddGemstoneType}
							disabled={addGemstoneType.isPending}
						>
							<Text>Add</Text>
						</Button>
					</View>
					{error ? <Text style={styles.errorText}>{error}</Text> : null}

					<View style={styles.listContainer}>
						{isLoading ? (
							<Text>Loading gemstone types...</Text>
						) : gemstoneTypes.length === 0 ? (
							<Text>No custom gemstone types added yet.</Text>
						) : (
							<FlatList
								data={gemstoneTypes}
								keyExtractor={(item) => item.id}
								renderItem={({ item }) => (
									<List.Item
										title={item.name}
										description={
											stoneCounts[item.name]
												? `Used in ${stoneCounts[item.name]} stone${
														stoneCounts[item.name] === 1 ? "" : "s"
													}`
												: "Not used in any stones"
										}
										right={(props) => (
											<Button
												size="sm"
												variant="destructive"
												onPress={() => handleDeleteGemstoneType(item)}
												disabled={deleteGemstoneType.isPending}
											>
												<Text>Delete</Text>
											</Button>
										)}
									/>
								)}
								ItemSeparatorComponent={() => <Divider />}
							/>
						)}
					</View>
				</Dialog.Content>
				<Dialog.Actions>
					<Button variant="outline" onPress={onDismiss}>
						<Text>Close</Text>
					</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 16,
		marginBottom: 8,
	},
	input: {
		flex: 1,
		marginRight: 8,
	},
	errorText: {
		color: "red",
		marginBottom: 8,
	},
	listContainer: {
		marginTop: 16,
		maxHeight: 300,
	},
});
