import React, { useState } from "react";
import { StyleSheet, View, FlatList, Alert } from "react-native";
import { Dialog, Portal, TextInput, List, Divider } from "react-native-paper";
import { Tables } from "@/lib/database.types";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { H3, Muted } from "./ui/typography";
import { useOrganizationColors } from "@/hooks/useOrganizationColors";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

type ColorsDialogProps = {
	visible: boolean;
	onDismiss: () => void;
};

export const ColorsDialog = ({ visible, onDismiss }: ColorsDialogProps) => {
	const { colorScheme } = useColorScheme();
	const [newColorName, setNewColorName] = useState("");
	const [error, setError] = useState("");

	const {
		colors: orgColors,
		isLoading,
		stoneCounts,
		isLoadingStoneCounts,
		addColor,
		deleteColor,
	} = useOrganizationColors();

	const handleAddColor = async () => {
		if (!newColorName.trim()) {
			setError("Please enter a color name");
			return;
		}

		try {
			setError("");
			await addColor.mutateAsync(newColorName);
			setNewColorName("");
		} catch (err: any) {
			setError(err.message || "Failed to add color");
		}
	};

	const handleDeleteColor = (color: Tables<"organization_colors">) => {
		// Check if color has stones
		const stoneCount = stoneCounts[color.id] || 0;

		if (stoneCount > 0) {
			Alert.alert(
				"Color is in use",
				`This color is used by ${stoneCount} stone${stoneCount === 1 ? "" : "s"}. Are you sure you want to remove it?`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Remove",
						style: "destructive",
						onPress: () => confirmDeleteColor(color),
					},
				],
			);
		} else {
			confirmDeleteColor(color);
		}
	};

	const confirmDeleteColor = async (color: Tables<"organization_colors">) => {
		try {
			await deleteColor.mutateAsync(color.id);
		} catch (err: any) {
			Alert.alert("Error", err.message || "Failed to delete color");
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
					<H3>Manage Colors</H3>
				</Dialog.Title>
				<Dialog.Content>
					<Muted>
						Add or remove gemstone colors for your organization. These will be
						available in all gemstone forms and filters.
					</Muted>

					<View style={styles.inputContainer}>
						<TextInput
							label="New Color"
							value={newColorName}
							onChangeText={setNewColorName}
							style={styles.input}
							error={!!error}
						/>
						<Button
							size="sm"
							variant="default"
							onPress={handleAddColor}
							disabled={addColor.isPending}
						>
							<Text>Add</Text>
						</Button>
					</View>
					{error ? <Text style={styles.errorText}>{error}</Text> : null}

					<View style={styles.listContainer}>
						{isLoading ? (
							<Text>Loading colors...</Text>
						) : orgColors.length === 0 ? (
							<Text>No custom colors added yet.</Text>
						) : (
							<FlatList
								data={orgColors}
								keyExtractor={(item) => item.id}
								renderItem={({ item }) => (
									<List.Item
										title={item.name}
										description={
											stoneCounts[item.id]
												? `Used in ${stoneCounts[item.id]} stone${
														stoneCounts[item.id] === 1 ? "" : "s"
													}`
												: "Not used in any stones"
										}
										right={(props) => (
											<Button
												size="sm"
												variant="destructive"
												onPress={() => handleDeleteColor(item)}
												disabled={deleteColor.isPending}
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
