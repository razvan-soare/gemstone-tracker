import React, { useState } from "react";
import {
	StyleSheet,
	View,
	FlatList,
	TextInput as RNTextInput,
	Alert,
} from "react-native";
import { Dialog, Portal, TextInput, List, Divider } from "react-native-paper";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { H3, Muted } from "./ui/typography";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

type ManagementDialogProps<T> = {
	visible: boolean;
	onDismiss: () => void;
	title: string;
	description: string;
	inputLabel: string;
	items: T[];
	isLoading: boolean;
	itemCounts: Record<string, number>;
	onAddItem: (name: string) => Promise<void>;
	onDeleteItem: (item: T) => void;
	getItemName: (item: T) => string;
	getItemId: (item: T) => string;
	getItemDescription?: (item: T, count: number) => string;
};

export const ManagementDialog = <T,>({
	visible,
	onDismiss,
	title,
	description,
	inputLabel,
	items,
	isLoading,
	itemCounts,
	onAddItem,
	onDeleteItem,
	getItemName,
	getItemId,
	getItemDescription = (item, count) =>
		count
			? `Used in ${count} stone${count === 1 ? "" : "s"}`
			: "Not used in any stones",
}: ManagementDialogProps<T>) => {
	const { colorScheme } = useColorScheme();
	const [newItemName, setNewItemName] = useState("");
	const [error, setError] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [isAddingItem, setIsAddingItem] = useState(false);

	const handleAddItem = async () => {
		if (!newItemName.trim()) {
			setError(`Please enter a ${inputLabel.toLowerCase()}`);
			return;
		}

		try {
			setError("");
			setIsAddingItem(true);
			await onAddItem(newItemName);
			setNewItemName("");
		} catch (err: any) {
			setError(err.message || `Failed to add ${inputLabel.toLowerCase()}`);
		} finally {
			setIsAddingItem(false);
		}
	};

	const handleDeleteItem = (item: T) => {
		const itemId = getItemId(item);
		const itemName = getItemName(item);
		const count = itemCounts[itemId] || 0;

		if (count > 0) {
			Alert.alert(
				`${itemName} is in use`,
				`This ${inputLabel.toLowerCase()} is used by ${count} stone${count === 1 ? "" : "s"}. Are you sure you want to remove it?`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Remove",
						style: "destructive",
						onPress: () => onDeleteItem(item),
					},
				],
			);
		} else {
			onDeleteItem(item);
		}
	};

	// Filter items based on search query
	const filteredItems = items.filter((item) =>
		getItemName(item).toLowerCase().includes(searchQuery.toLowerCase()),
	);

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
					<H3>{title}</H3>
				</Dialog.Title>
				<Dialog.Content>
					<Muted>{description}</Muted>

					<View style={styles.searchContainer}>
						<TextInput
							label="Search"
							placeholder="Search..."
							value={searchQuery}
							onChangeText={setSearchQuery}
							mode="outlined"
							style={styles.searchInput}
							left={<TextInput.Icon icon="magnify" />}
							right={
								searchQuery ? (
									<TextInput.Icon
										icon="close"
										onPress={() => setSearchQuery("")}
									/>
								) : null
							}
						/>
					</View>

					<View style={styles.listContainer}>
						{isLoading ? (
							<Text>Loading...</Text>
						) : filteredItems.length === 0 ? (
							searchQuery ? (
								<Text>No results found</Text>
							) : (
								<Text>No items added yet</Text>
							)
						) : (
							<FlatList
								data={filteredItems}
								keyExtractor={(item) => getItemId(item)}
								renderItem={({ item }) => (
									<List.Item
										title={getItemName(item)}
										description={getItemDescription(
											item,
											itemCounts[getItemId(item)] || 0,
										)}
										right={(props) => (
											<Button
												size="sm"
												variant="destructive"
												onPress={() => handleDeleteItem(item)}
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

					<View style={styles.inputContainer}>
						<TextInput
							label={inputLabel}
							value={newItemName}
							onChangeText={setNewItemName}
							style={styles.input}
							error={!!error}
							onSubmitEditing={handleAddItem}
						/>
						<Button
							size="sm"
							variant="default"
							onPress={handleAddItem}
							disabled={isAddingItem}
						>
							<Text>Add</Text>
						</Button>
					</View>
					{error ? <Text style={styles.errorText}>{error}</Text> : null}
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
	searchContainer: {
		marginTop: 16,
		marginBottom: 8,
	},
	searchInput: {
		width: "100%",
	},
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
		marginTop: 8,
		maxHeight: 300,
	},
});
