import { GemstoneOwner } from "@/app/types/gemstone";
import { useOrganizationOwners } from "@/hooks/useOrganizationOwners";
import DateTimePicker, {
	DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
	Button,
	Dialog,
	Divider,
	IconButton,
	Menu,
	Portal,
	Text,
} from "react-native-paper";

export type ExportFilters = {
	startDate: Date;
	endDate: Date;
	soldStatus: "all" | "sold" | "unsold";
	owner: GemstoneOwner | "all";
};

type ExportDialogProps = {
	visible: boolean;
	onDismiss: () => void;
	onConfirm: (filters: ExportFilters) => void;
	initialSoldStatus?: "all" | "sold" | "unsold";
	selectedCount?: number;
};

const ExportDialog = ({
	visible,
	onDismiss,
	onConfirm,
	initialSoldStatus = "all",
	selectedCount = 0,
}: ExportDialogProps) => {
	// Initialize with default values
	const getDefaultStartDate = useCallback(() => {
		const date = new Date();
		date.setMonth(date.getMonth() - 1); // Default to 1 month ago
		return date;
	}, []);

	const [startDate, setStartDate] = useState(getDefaultStartDate);
	const [endDate, setEndDate] = useState(new Date());
	const [soldStatus, setSoldStatus] = useState<"all" | "sold" | "unsold">(
		initialSoldStatus,
	);
	const [owner, setOwner] = useState<GemstoneOwner | "all">("all");
	const { owners } = useOrganizationOwners();

	// Dropdown menu visibility states
	const [soldStatusMenuVisible, setSoldStatusMenuVisible] = useState(false);
	const [ownerMenuVisible, setOwnerMenuVisible] = useState(false);

	const resetDates = () => {
		setStartDate(getDefaultStartDate());
		setEndDate(new Date());
	};

	const handleConfirm = () => {
		onConfirm({
			startDate,
			endDate,
			soldStatus,
			owner,
		});
	};

	// Get display text for selected values
	const getSoldStatusDisplayText = () => {
		switch (soldStatus) {
			case "all":
				return "All Gemstones";
			case "sold":
				return "Sold Gemstones Only";
			case "unsold":
				return "Unsold Gemstones Only";
			default:
				return "All Gemstones";
		}
	};

	const getOwnerDisplayText = () => {
		if (owner === "all") {
			return "All Owners";
		}
		return owner;
	};

	if (selectedCount > 0) {
		return (
			<Portal>
				<Dialog visible={visible} onDismiss={onDismiss}>
					<Dialog.Title>Export Options</Dialog.Title>

					<View className="p-4">
						<View style={styles.selectedCountContainer}>
							<Text style={styles.selectionAlert}>
								You have selected {selectedCount} gemstone
								{selectedCount === 1 ? "" : "s"}
							</Text>
							<Text>Only the selected gemstones will be exported.</Text>
						</View>
						<Divider style={styles.divider} />
					</View>

					<Dialog.Actions>
						<Button onPress={onDismiss}>Cancel</Button>
						<Button onPress={handleConfirm}>
							Export {selectedCount} Selected
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
		);
	}

	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onDismiss}>
				<Dialog.Title>Export Options</Dialog.Title>
				<Dialog.ScrollArea style={styles.scrollArea}>
					<View style={styles.content}>
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Date Range</Text>
							<IconButton
								icon="refresh"
								size={20}
								onPress={resetDates}
								accessibilityLabel="Reset dates"
							/>
						</View>

						<View style={styles.dateRow}>
							<Text>Start Date: </Text>
							<DateTimePicker
								value={startDate}
								mode="date"
								display="default"
								onChange={(
									_event: DateTimePickerEvent,
									selectedDate?: Date,
								) => {
									if (selectedDate) {
										setStartDate(selectedDate);
									}
								}}
							/>
						</View>

						<View style={styles.dateRow}>
							<Text>End Date: </Text>
							<DateTimePicker
								value={endDate}
								mode="date"
								display="default"
								onChange={(
									_event: DateTimePickerEvent,
									selectedDate?: Date,
								) => {
									if (selectedDate) {
										setEndDate(selectedDate);
									}
								}}
							/>
						</View>

						<View className="flex-row justify-between">
							<Text style={styles.sectionTitle}>Sold Status</Text>
							<View style={styles.dropdownContainer}>
								<Menu
									visible={soldStatusMenuVisible}
									onDismiss={() => setSoldStatusMenuVisible(false)}
									anchor={
										<Button
											mode="outlined"
											onPress={() => setSoldStatusMenuVisible(true)}
											style={styles.dropdown}
										>
											{getSoldStatusDisplayText()}
										</Button>
									}
								>
									<Menu.Item
										onPress={() => {
											setSoldStatus("all");
											setSoldStatusMenuVisible(false);
										}}
										title="All Gemstones"
									/>
									<Menu.Item
										onPress={() => {
											setSoldStatus("sold");
											setSoldStatusMenuVisible(false);
										}}
										title="Sold Gemstones Only"
									/>
									<Menu.Item
										onPress={() => {
											setSoldStatus("unsold");
											setSoldStatusMenuVisible(false);
										}}
										title="Unsold Gemstones Only"
									/>
								</Menu>
							</View>
						</View>
						<View className="flex-row justify-between">
							<Text style={styles.sectionTitle}>Owner</Text>
							<View style={styles.dropdownContainer}>
								<Menu
									visible={ownerMenuVisible}
									onDismiss={() => setOwnerMenuVisible(false)}
									anchor={
										<Button
											mode="outlined"
											onPress={() => setOwnerMenuVisible(true)}
											style={styles.dropdown}
										>
											{getOwnerDisplayText()}
										</Button>
									}
								>
									<Menu.Item
										onPress={() => {
											setOwner("all");
											setOwnerMenuVisible(false);
										}}
										title="All Owners"
									/>
									{owners.map((ownerItem) => (
										<Menu.Item
											key={ownerItem.id}
											onPress={() => {
												setOwner(ownerItem.name);
												setOwnerMenuVisible(false);
											}}
											title={ownerItem.name}
										/>
									))}
								</Menu>
							</View>
						</View>
					</View>
				</Dialog.ScrollArea>

				<Dialog.Actions>
					<Button onPress={onDismiss}>Cancel</Button>
					<Button onPress={handleConfirm}>Export</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	scrollArea: {
		maxHeight: 400,
	},
	content: {
		paddingVertical: 8,
	},
	sectionTitle: {
		fontWeight: "bold",
		marginTop: 16,
		marginBottom: 8,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	dateRow: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		justifyContent: "space-between",
		marginVertical: 8,
	},
	dateButton: {
		marginLeft: 8,
	},
	dropdownContainer: {
		marginVertical: 8,
	},
	dropdown: {
		width: "100%",
		marginVertical: 4,
	},
	radioGroup: {
		marginLeft: 8,
	},
	radioItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 8,
		paddingRight: 16,
	},
	selectedCountContainer: {
		padding: 12,
		borderRadius: 8,
		marginBottom: 8,
	},
	selectionAlert: {
		fontWeight: "bold",
		fontSize: 16,
		marginBottom: 4,
	},
	divider: {
		marginVertical: 12,
	},
});

export default ExportDialog;
