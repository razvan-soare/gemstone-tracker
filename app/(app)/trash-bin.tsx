import { P } from "@/components/ui/typography";
import { supabase } from "@/config/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { CheckIcon } from "lucide-react-native";
import React, { useState } from "react";
import {
	FlatList,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { Button, Dialog, FAB, Portal } from "react-native-paper";

const TrashBinScreen = () => {
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
	const queryClient = useQueryClient();
	const { data: deletedGemstones = [], isLoading } = useQuery({
		queryKey: ["deleted-gemstones"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("stones")
				.select("*")
				.not("deleted_at", "is", null)
				.order("deleted_at", { ascending: false });

			if (error) {
				throw new Error(error.message);
			}
			return data || [];
		},
	});

	const handleRestore = async () => {
		const { error: stonesError } = await supabase
			.from("stones")
			.update({
				deleted_at: null,
				deleted_by: null,
			} as any)
			.in("id", selectedIds);

		if (stonesError) {
			throw new Error(stonesError.message);
		}

		// Invalidate all relevant queries
		queryClient.invalidateQueries({
			queryKey: ["deleted-gemstones"],
		});
		queryClient.invalidateQueries({
			queryKey: ["gemstones"],
		});
		queryClient.invalidateQueries({
			queryKey: ["gemstones-by-date"],
		});
	};

	if (isLoading) {
		return (
			<SafeAreaView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<Text>Loading...</Text>
			</SafeAreaView>
		);
	}

	if (deletedGemstones.length === 0) {
		return (
			<SafeAreaView
				style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
			>
				<Text>No deleted gemstones found.</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View style={{ flex: 1, padding: 16, width: "100%" }}>
				<FlatList
					data={deletedGemstones}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => {
						const isSelected = selectedIds.includes(item.id);
						return (
							<TouchableOpacity
								onPress={() => {
									if (isSelected) {
										setSelectedIds(selectedIds.filter((id) => id !== item.id));
									} else {
										setSelectedIds([...selectedIds, item.id]);
									}
								}}
								className="flex-row items-center flex gap-4 h-10 w-full"
							>
								<View
									className={clsx(
										`${isSelected ? "bg-orange-500" : "bg-transparent"} ${isSelected ? "border-none" : "border-2 border-gray-300"}`,
										"rounded-full flex items-center justify-center h-6 w-6",
									)}
								>
									<CheckIcon size={14} color="white" />
								</View>
								<Text>{item.name || "Unnamed Gemstone"}</Text>
							</TouchableOpacity>
						);
					}}
				/>
			</View>
			<FAB
				icon="restore"
				style={{
					display: selectedIds.length > 0 ? "flex" : "none",
					position: "absolute",
					margin: 16,
					right: 0,
					bottom: 20,
					borderRadius: 100,
				}}
				onPress={() => setRestoreDialogVisible(true)}
			/>
			<RestoreDialog
				visible={restoreDialogVisible}
				selectedCount={selectedIds.length}
				onDismiss={() => setRestoreDialogVisible(false)}
				onConfirm={handleRestore}
			/>
		</SafeAreaView>
	);
};

export default TrashBinScreen;

export const RestoreDialog = ({
	visible,
	onDismiss,
	onConfirm,
	selectedCount,
}: {
	visible: boolean;
	onDismiss: () => void;
	onConfirm: () => void;
	selectedCount: number;
}) => {
	const handleConfirm = () => {
		onConfirm();
		onDismiss();
	};

	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onDismiss}>
				<Dialog.Title>Restore Gemstones</Dialog.Title>

				<View className="px-8">
					<P>
						Are you sure you want to restore {selectedCount} gemstone
						{selectedCount > 1 ? "s" : ""}?
					</P>
				</View>

				<Dialog.Actions>
					<Button onPress={onDismiss}>Cancel</Button>
					<Button onPress={handleConfirm}>Restore</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

const styles = StyleSheet.create({
	scrollArea: {
		maxHeight: 400,
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
