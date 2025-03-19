import React, { useState } from "react";
import { StyleSheet, View, FlatList, Alert } from "react-native";
import { Dialog, Portal, TextInput, List, Divider } from "react-native-paper";
import { Tables } from "@/lib/database.types";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { H3, Muted } from "./ui/typography";
import { useOrganizationShapes } from "@/hooks/useOrganizationShapes";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

type ShapesDialogProps = {
	visible: boolean;
	onDismiss: () => void;
};

export const ShapesDialog = ({ visible, onDismiss }: ShapesDialogProps) => {
	const { colorScheme } = useColorScheme();
	const [newShapeName, setNewShapeName] = useState("");
	const [error, setError] = useState("");

	const {
		shapes,
		isLoading,
		stoneCounts,
		isLoadingStoneCounts,
		addShape,
		deleteShape,
	} = useOrganizationShapes();

	const handleAddShape = async () => {
		if (!newShapeName.trim()) {
			setError("Please enter a shape name");
			return;
		}

		try {
			setError("");
			await addShape.mutateAsync(newShapeName);
			setNewShapeName("");
		} catch (err: any) {
			setError(err.message || "Failed to add shape");
		}
	};

	const handleDeleteShape = (shape: Tables<"organization_shapes">) => {
		// Check if shape has stones
		const stoneCount = stoneCounts[shape.id] || 0;

		if (stoneCount > 0) {
			Alert.alert(
				"Shape is in use",
				`This shape is used by ${stoneCount} stone${stoneCount === 1 ? "" : "s"}. Are you sure you want to remove it?`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Remove",
						style: "destructive",
						onPress: () => confirmDeleteShape(shape),
					},
				],
			);
		} else {
			confirmDeleteShape(shape);
		}
	};

	const confirmDeleteShape = async (shape: Tables<"organization_shapes">) => {
		try {
			await deleteShape.mutateAsync(shape.id);
		} catch (err: any) {
			Alert.alert("Error", err.message || "Failed to delete shape");
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
					<H3>Manage Shapes</H3>
				</Dialog.Title>
				<Dialog.Content>
					<Muted>
						Add or remove gemstone shapes for your organization. These will be
						available in all gemstone forms and filters.
					</Muted>

					<View style={styles.inputContainer}>
						<TextInput
							label="New Shape"
							value={newShapeName}
							onChangeText={setNewShapeName}
							style={styles.input}
							error={!!error}
						/>
						<Button
							size="sm"
							variant="default"
							onPress={handleAddShape}
							disabled={addShape.isPending}
						>
							<Text>Add</Text>
						</Button>
					</View>
					{error ? <Text style={styles.errorText}>{error}</Text> : null}

					<View style={styles.listContainer}>
						{isLoading ? (
							<Text>Loading shapes...</Text>
						) : shapes.length === 0 ? (
							<Text>No custom shapes added yet.</Text>
						) : (
							<FlatList
								data={shapes}
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
												onPress={() => handleDeleteShape(item)}
												disabled={deleteShape.isPending}
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
