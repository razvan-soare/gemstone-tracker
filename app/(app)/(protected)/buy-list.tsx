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
import { List, SegmentedButtons, Surface, Text } from "react-native-paper";

import { Currency, CurrencySymbols } from "@/app/types/gemstone";
import ExportButton from "@/components/ExportButton";
import { H2, P } from "@/components/ui/typography";
import { colors } from "@/constants/colors";
import { GemstoneFilter, useGemstonesByDate } from "@/hooks/useGemstonesByDate";
import { Tables } from "@/lib/database.types";
import { useColorScheme } from "@/lib/useColorScheme";
import { router } from "expo-router";
import { CheckIcon, ChevronRight } from "lucide-react-native";

type GemstoneItemProps = {
	gemstone: Tables<"stones"> & { images: Tables<"images">[] };
	backgroundColor: string;
	isSelected: boolean;
	onToggleSelect: (
		gemstoneId: string,
		forceEnterSelectionMode?: boolean,
	) => void;
};

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

const GemstoneItem = ({
	gemstone,
	backgroundColor,
	isSelected,
	onToggleSelect,
}: GemstoneItemProps) => {
	const buyCurrencySymbol = getCurrencySymbol(gemstone.buy_currency);
	const sellCurrencySymbol = getCurrencySymbol(gemstone.sell_currency);

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
					<View className="flex-row items-center justify-between gap-2">
						{gemstone.sold && (
							<View className="relative w-15 h-15 overflow-visible justify-center items-center">
								<View className="bg-red-600 px-2 py-1 rounded shadow-md transform rotate-45">
									<P className="text-white font-bold text-xs text-center">
										SOLD
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
							<TouchableOpacity onPress={handlePress}>
								<ChevronRight size={20} color="black" />
							</TouchableOpacity>
						</View>
					</View>
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
						<Text>No gemstones found</Text>
					</View>
				)}
			/>
		</>
	);
};

export default function BuyList() {
	const { colorScheme } = useColorScheme();
	const [activeTab, setActiveTab] = useState<GemstoneFilter>("all");
	const [selectedGemstones, setSelectedGemstones] = useState<string[]>([]);

	useEffect(() => {
		setSelectedGemstones([]);
	}, [activeTab]);

	const backgroundColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;

	const itemBackgroundColor = colorScheme === "dark" ? "#2c2c2c" : "#ffffff";

	return (
		<SafeAreaView style={[styles.container, { backgroundColor }]}>
			<StatusBar
				barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
			/>

			<View className="w-full items-center justify-center py-4">
				<H2>Gemstone History</H2>
			</View>

			<View style={styles.segmentedButtonContainer}>
				<SegmentedButtons
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as GemstoneFilter)}
					buttons={[
						{
							value: "all",
							label: "All",
						},
						{
							value: "stock",
							label: "Stock",
						},
						{
							value: "sold",
							label: "Sold",
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
			{/* Selection Count Indicator */}
			{selectedGemstones.length > 0 && (
				<TouchableOpacity
					style={styles.selectionCountButton}
					onPress={() => setSelectedGemstones([])}
				>
					<Text style={styles.selectionCountText}>
						{selectedGemstones.length} selected
					</Text>
				</TouchableOpacity>
			)}
			{/* Export Button */}
			<ExportButton
				style={styles.exportFab}
				filter={activeTab}
				selectedGemstoneIds={
					selectedGemstones.length > 0 ? selectedGemstones : undefined
				}
			/>
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
	exportFab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 0, // Position above the add button
		borderRadius: 100,
	},
	selectionControls: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	selectionCount: {
		fontWeight: "bold",
	},
	selectionCountButton: {
		position: "absolute",
		backgroundColor: "#ff6b00",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		right: 16,
		bottom: 80,
		zIndex: 100,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	selectionCountText: {
		color: "white",
		fontWeight: "bold",
	},
});
