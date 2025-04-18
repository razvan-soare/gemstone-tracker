import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { FAB } from "react-native-paper";

import {
	GemstoneColor,
	GemstoneOwner,
	GemstoneShape,
} from "@/app/types/gemstone";
import FilterButton from "@/components/FilterButton";
import GemstoneList from "@/components/GemstoneList";
import SearchBar from "@/components/SearchBar";
import { H4 } from "@/components/ui/typography";
import { colors } from "@/constants/colors";
import { useSupabase } from "@/context/supabase-provider";
import { useColumnPreference } from "@/hooks/useColumnPreference";
import { useGemstones } from "@/hooks/useGemstones";
import { useLanguage } from "@/hooks/useLanguage";
import { useColorScheme } from "@/lib/useColorScheme";

export default function Home() {
	const [searchQuery, setSearchQuery] = useState("");
	const [filters, setFilters] = useState<{
		shape?: GemstoneShape;
		color?: GemstoneColor;
		sold?: boolean;
		owner?: GemstoneOwner;
	}>({});
	const { activeOrganization } = useSupabase();
	const { colorScheme } = useColorScheme();
	const { columnCount, refreshColumnCount } = useColumnPreference();
	const { t } = useLanguage();

	// Refresh column count when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			refreshColumnCount();
		}, [refreshColumnCount]),
	);

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useGemstones({
			search: searchQuery,
			...filters,
		});

	const gemstones = data?.pages.flatMap((page) => page.items) ?? [];

	return (
		<SafeAreaView
			style={[
				styles.container,
				{
					backgroundColor:
						colorScheme === "dark"
							? colors.dark.background
							: colors.light.background,
				},
			]}
		>
			<StatusBar
				barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
			/>

			<View className="w-full items-center justify-center px-2">
				<H4>{activeOrganization?.name}</H4>
			</View>

			<View style={styles.headerButtons}>
				<View style={styles.searchContainer}>
					<SearchBar
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
					/>
				</View>
				<View style={styles.rightButtons}>
					<FilterButton filters={filters} onFiltersChange={setFilters} />
				</View>
			</View>

			<GemstoneList
				gemstones={gemstones}
				isLoading={isLoading}
				onLoadMore={fetchNextPage}
				hasNextPage={!!hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
				columnCount={columnCount}
			/>
			<FAB
				icon="plus"
				style={styles.fab}
				onPress={() => router.push("/(app)/add-new-gemstone")}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "column",
		alignItems: "center",
		padding: 8,
		gap: 8,
	},
	headerButtons: {
		marginTop: 16,
		paddingHorizontal: 16,
		paddingBottom: 8,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 8,
	},
	searchContainer: {
		flex: 1,
	},
	rightButtons: {
		flexDirection: "row",
		alignItems: "center",
	},
	fab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 0,
		borderRadius: 100,
	},
});
