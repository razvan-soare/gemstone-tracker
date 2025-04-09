import React, { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	SafeAreaView,
	SectionList,
	StatusBar,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import {
	List,
	SegmentedButtons,
	Snackbar,
	Surface,
	Text,
} from "react-native-paper";

import { Currency, CurrencySymbols } from "@/app/types/gemstone";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { ExportDialog, ExportFilters } from "@/components/ExportDialog";
import FloatingActionButton from "@/components/FloatingActionButton";
import { H2, P } from "@/components/ui/typography";
import { supabase } from "@/config/supabase";
import { colors } from "@/constants/colors";
import { useSupabase } from "@/context/supabase-provider";
import { GemstoneFilter, useGemstonesByDate } from "@/hooks/useGemstonesByDate";
import { useLanguage } from "@/hooks/useLanguage";
import { useOrganizationOwners } from "@/hooks/useOrganizationOwners";
import { Tables } from "@/lib/database.types";
import { exportToNumbers } from "@/lib/exportToNumbers";
import { useColorScheme } from "@/lib/useColorScheme";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { CheckIcon, ChevronRight } from "lucide-react-native";

// Helper function to safely get currency symbol
const getCurrencySymbol = (currencyCode: string | null): string => {
	if (!currencyCode) return "$";

	// Check if the currency code is a valid Currency enum value
	const isValidCurrency = Object.values(Currency).includes(currencyCode as any);
	if (isValidCurrency) {
		return CurrencySymbols[currencyCode as Currency];
	}

	return "$"; // Default fallback
};

type GemstoneItemProps = {
	gemstone: Tables<"stones"> & { images: Tables<"images">[] };
	backgroundColor: string;
	isSelected: boolean;
	onToggleSelect: (
		gemstoneId: string,
		forceEnterSelectionMode?: boolean,
	) => void;
};

const GemstoneItem = ({
	gemstone,
	backgroundColor,
	isSelected,
	onToggleSelect,
}: GemstoneItemProps) => {
	const buyCurrencySymbol = getCurrencySymbol(gemstone.buy_currency);
	const sellCurrencySymbol = getCurrencySymbol(gemstone.sell_currency);
	const { t } = useLanguage();

	const handlePress = () => {
		router.push(`/(app)/gemstone/${gemstone.id}`);
	};

	const handleSelectPress = () => {
		onToggleSelect(gemstone.id, true);
	};

	return (
		<Surface style={[styles.gemstoneItem, { backgroundColor }]}>
			<List.Item
				title={gemstone.name}
				description={`${gemstone.shape}, ${gemstone.color}, ${gemstone.cut}`}
				left={() => (
					<TouchableOpacity onPress={handleSelectPress}>
						<View
							className={`ml-4 mt-1 ${isSelected ? "bg-orange-500" : "bg-transparent"} ${isSelected ? "border-none" : "border-2 border-gray-300"} rounded-full flex items-center justify-center h-6 w-6`}
						>
							<CheckIcon size={14} color="white" />
						</View>
					</TouchableOpacity>
				)}
				right={() => (
					<TouchableOpacity onPress={handlePress}>
						<View className="flex-row items-center justify-between gap-2">
							{gemstone.sold && (
								<View className="relative w-15 h-15 overflow-visible justify-center items-center">
									<View className="bg-red-600 px-2 py-1 rounded shadow-md transform rotate-45">
										<P className="text-white font-bold text-xs text-center">
											{t("gemstones.sold")}
										</P>
									</View>
								</View>
							)}

							<View style={styles.priceContainer}>
								<P className="text-green-500 font-semibold">
									{gemstone.buy_price ? gemstone.buy_price.toFixed(2) : "N/A"}{" "}
									{buyCurrencySymbol}
								</P>
								<P className="text-red-500 font-semibold">
									{gemstone.sell_price ? gemstone.sell_price.toFixed(2) : "N/A"}{" "}
									{sellCurrencySymbol}
								</P>
							</View>
							<View>
								<ChevronRight size={20} color="black" />
							</View>
						</View>
					</TouchableOpacity>
				)}
				titleStyle={styles.gemstoneTitle}
				descriptionStyle={styles.gemstoneDescription}
			/>
		</Surface>
	);
};

// Component to render the gemstone list based on filter
const GemstoneListView = ({
	filter,
	backgroundColor,
	itemBackgroundColor,
	selectedGemstones,
	setSelectedGemstones,
}: {
	filter: GemstoneFilter;
	backgroundColor: string;
	itemBackgroundColor: string;
	selectedGemstones: string[];
	setSelectedGemstones: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
	const { data: groupedGemstones, isLoading } = useGemstonesByDate(filter);
	const { t } = useLanguage();

	const handleToggleSelect = useCallback(
		(gemstoneId: string) => {
			setSelectedGemstones((prev) => {
				const newSelected = prev.includes(gemstoneId)
					? prev.filter((id) => id !== gemstoneId)
					: [...prev, gemstoneId];

				return newSelected;
			});
		},
		[setSelectedGemstones],
	);

	const handleSelectGroup = useCallback(
		(items: (Tables<"stones"> & { images: Tables<"images">[] })[]) => {
			setSelectedGemstones((prev) => {
				// Check if all items in the group are already selected
				const allSelected = items.every((item) => prev.includes(item.id));

				if (allSelected) {
					// If all are selected, deselect them all
					return prev.filter((id) => !items.some((item) => item.id === id));
				} else {
					// Otherwise select all items in the group that aren't already selected
					const newIds = items
						.filter((item) => !prev.includes(item.id))
						.map((item) => item.id);
					return [...prev, ...newIds];
				}
			});
		},
		[setSelectedGemstones],
	);

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
				<Text style={styles.loadingText}>{t("common.loading")}</Text>
			</View>
		);
	}

	return (
		<>
			<SectionList
				sections={groupedGemstones || []}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View style={{ backgroundColor }}>
						<GemstoneItem
							gemstone={item}
							backgroundColor={itemBackgroundColor}
							isSelected={selectedGemstones.includes(item.id)}
							onToggleSelect={handleToggleSelect}
						/>
					</View>
				)}
				renderSectionHeader={({ section: { title, data } }) => (
					<View
						style={[styles.sectionHeader, { backgroundColor }]}
						className="flex-row items-center gap-4 pl-6"
					>
						<TouchableOpacity
							onPress={() => handleSelectGroup(data)}
							className="flex-row items-center"
						>
							<View
								className={`${data.every((item) => selectedGemstones.includes(item.id)) ? "bg-orange-500" : "bg-transparent"} ${data.every((item) => selectedGemstones.includes(item.id)) ? "border-none" : "border-2 border-gray-300"} rounded-full flex items-center justify-center h-6 w-6`}
							>
								<CheckIcon size={14} color="white" />
							</View>
						</TouchableOpacity>
						<P style={styles.sectionHeaderText}>{title}</P>
					</View>
				)}
				contentContainerStyle={styles.listContent}
				stickySectionHeadersEnabled={true}
				ListEmptyComponent={() => (
					<View style={styles.emptyContainer}>
						<Text>{t("gemstones.noGemstones")}</Text>
					</View>
				)}
			/>
		</>
	);
};

export default function BuyList() {
	const [activeTab, setActiveTab] = useState<GemstoneFilter>("all");
	const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
	const [exportDialogVisible, setExportDialogVisible] = useState(false);
	const [selectedGemstones, setSelectedGemstones] = useState<string[]>([]);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const queryClient = useQueryClient();
	const { activeOrganization, user } = useSupabase();
	const { colorScheme } = useColorScheme();
	const { owners } = useOrganizationOwners();
	const { t } = useLanguage();

	useEffect(() => {
		setSelectedGemstones([]);
	}, [activeTab]);

	const backgroundColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;

	const itemBackgroundColor = colorScheme === "dark" ? "#2c2c2c" : "#ffffff";

	const handleExport = () => {
		setExportDialogVisible(true);
	};

	const handleDelete = () => {
		setDeleteDialogVisible(true);
	};

	const showSnackbar = (message: string) => {
		setSnackbarMessage(message);
		setSnackbarVisible(true);
	};

	const handleConfirmDelete = async () => {
		try {
			const { error: stonesError } = await supabase
				.from("stones")
				.update({
					deleted_at: new Date().toISOString(),
					deleted_by: user?.id,
				} as any)
				.in("id", selectedGemstones);

			if (stonesError) throw stonesError;

			// Clear selection after successful soft delete
			setSelectedGemstones([]);
			setDeleteDialogVisible(false);
			showSnackbar(
				`Successfully deleted ${selectedGemstones.length} gemstone(s)`,
			);

			// Invalidate all relevant queries
			queryClient.invalidateQueries({
				queryKey: ["gemstones", activeOrganization],
			});
			queryClient.invalidateQueries({
				queryKey: ["gemstones-by-date", activeOrganization?.id],
				exact: false,
			});
		} catch (error) {
			console.error("Error deleting gemstones:", error);
			showSnackbar("Failed to delete gemstones. Please try again.");
		}
	};

	const handleConfirmExport = async (filters: ExportFilters) => {
		try {
			// Get all selected gemstones
			const { data: selectedGemstoneData, error } = await supabase
				.from("stones")
				.select("*, images(*)")
				.in("id", selectedGemstones);

			if (error) throw error;

			if (!selectedGemstoneData || selectedGemstoneData.length === 0) {
				showSnackbar("No gemstones found to export.");
				return;
			}

			// Export the selected gemstones
			const result = await exportToNumbers({
				gemstones: selectedGemstoneData,
				filters,
				owners,
			});

			setExportDialogVisible(false);
			showSnackbar(result.message);
		} catch (error) {
			console.error("Error exporting gemstones:", error);
			showSnackbar("Failed to export gemstones. Please try again.");
		}
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor }]}>
			<StatusBar
				barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
			/>

			<View className="w-full items-center justify-center py-4">
				<H2>{t("buyList.title")}</H2>
				<TouchableOpacity
					onPress={() => router.push("/trash-bin")}
					style={{
						position: "absolute",
						right: 20,
						top: "50%",
						transform: [{ translateY: -12 }],
					}}
				>
					<Feather name="trash-2" size={24} color="black" />
				</TouchableOpacity>
			</View>

			<View style={styles.segmentedButtonContainer}>
				<SegmentedButtons
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as GemstoneFilter)}
					buttons={[
						{
							value: "all",
							label: t("buyList.all"),
						},
						{
							value: "stock",
							label: t("buyList.stock"),
						},
						{
							value: "sold",
							label: t("buyList.sold"),
						},
					]}
				/>
			</View>

			<GemstoneListView
				filter={activeTab}
				backgroundColor={backgroundColor}
				itemBackgroundColor={itemBackgroundColor}
				selectedGemstones={selectedGemstones}
				setSelectedGemstones={setSelectedGemstones}
			/>

			<FloatingActionButton
				selectedCount={selectedGemstones.length}
				onExport={handleExport}
				onDelete={handleDelete}
				onAdd={() => router.push("/(app)/add-new-gemstone")}
			/>

			<ExportDialog
				visible={exportDialogVisible}
				onDismiss={() => setExportDialogVisible(false)}
				onConfirm={handleConfirmExport}
				initialSoldStatus={
					activeTab !== "all"
						? activeTab === "sold"
							? "sold"
							: "unsold"
						: "all"
				}
				selectedCount={selectedGemstones.length}
			/>

			<DeleteConfirmationDialog
				visible={deleteDialogVisible}
				onDismiss={() => setDeleteDialogVisible(false)}
				onConfirm={handleConfirmDelete}
				count={selectedGemstones.length}
			/>

			<Snackbar
				visible={snackbarVisible}
				onDismiss={() => setSnackbarVisible(false)}
				duration={3000}
				action={{
					label: t("common.close"),
					onPress: () => setSnackbarVisible(false),
				}}
			>
				{snackbarMessage}
			</Snackbar>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 10,
		color: "#666",
	},
	listContent: {
		paddingBottom: 20,
	},
	sectionHeader: {
		padding: 12,
	},
	sectionHeaderText: {
		fontWeight: "bold",
		fontSize: 16,
	},
	gemstoneItem: {
		marginHorizontal: 8,
		marginVertical: 4,
		borderRadius: 8,
	},
	gemstoneTitle: {
		fontWeight: "bold",
	},
	gemstoneDescription: {
		fontSize: 12,
	},
	priceContainer: {
		justifyContent: "center",
		alignItems: "flex-end",
		paddingRight: 8,
	},
	emptyContainer: {
		padding: 20,
		alignItems: "center",
	},
	segmentedButtonContainer: {
		paddingHorizontal: 16,
		marginBottom: 16,
	},
});
