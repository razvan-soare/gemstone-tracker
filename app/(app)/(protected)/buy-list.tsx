import React, { useState } from "react";
import {
	ActivityIndicator,
	SafeAreaView,
	SectionList,
	StatusBar,
	StyleSheet,
	View,
} from "react-native";
import {
	Divider,
	List,
	Surface,
	Text,
	SegmentedButtons,
} from "react-native-paper";

import { H2, P } from "@/components/ui/typography";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";
import { useGemstonesByDate, GemstoneFilter } from "@/hooks/useGemstonesByDate";
import { useSupabase } from "@/context/supabase-provider";
import { Tables } from "@/lib/database.types";
import { router } from "expo-router";
import { Currency, CurrencySymbols } from "@/app/types/gemstone";

type GemstoneItemProps = {
	gemstone: Tables<"stones"> & { images: Tables<"images">[] };
	backgroundColor: string;
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

const GemstoneItem = ({ gemstone, backgroundColor }: GemstoneItemProps) => {
	const buyCurrencySymbol = getCurrencySymbol(gemstone.buy_currency);
	const sellCurrencySymbol = getCurrencySymbol(gemstone.sell_currency);

	return (
		<Surface style={[styles.gemstoneItem, { backgroundColor }]}>
			<List.Item
				title={gemstone.name}
				description={`${gemstone.shape}, ${gemstone.color}, ${gemstone.cut}`}
				right={() => (
					<View style={styles.priceContainer}>
						<P className="text-green-500 font-semibold">
							{buyCurrencySymbol}
							{gemstone.buy_price ? gemstone.buy_price.toFixed(2) : "N/A"}
						</P>
						<P className="text-red-500 font-semibold">
							{sellCurrencySymbol}
							{gemstone.sell_price ? gemstone.sell_price.toFixed(2) : "N/A"}
						</P>
					</View>
				)}
				onPress={() => router.push(`/(app)/gemstone/${gemstone.id}`)}
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
}: {
	filter: GemstoneFilter;
	backgroundColor: string;
	itemBackgroundColor: string;
}) => {
	const { data: groupedGemstones, isLoading } = useGemstonesByDate(filter);

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<SectionList
			sections={groupedGemstones || []}
			keyExtractor={(item) => item.id}
			renderItem={({ item }) => (
				<View style={{ backgroundColor }}>
					<GemstoneItem gemstone={item} backgroundColor={itemBackgroundColor} />
				</View>
			)}
			renderSectionHeader={({ section: { title } }) => (
				<View style={[styles.sectionHeader, { backgroundColor }]}>
					<Text style={styles.sectionHeaderText}>{title}</Text>
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
	);
};

export default function BuyList() {
	const { colorScheme } = useColorScheme();
	const { activeOrganization } = useSupabase();
	const [activeTab, setActiveTab] = useState<GemstoneFilter>("purchased");

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
							value: "purchased",
							label: "Purchased",
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
});
