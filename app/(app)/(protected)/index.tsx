import { router } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { FAB } from "react-native-paper";

import {
	GemstoneColor,
	GemstoneShape,
	GemstoneOwner,
} from "@/app/types/gemstone";
import FilterButton from "@/components/FilterButton";
import GemstoneList from "@/components/GemstoneList";
import SearchBar from "@/components/SearchBar";
import { colors } from "@/constants/colors";
import { useGemstones } from "@/hooks/useGemstones";
import { useColumnPreference } from "@/hooks/useColumnPreference";
import { useColorScheme } from "@/lib/useColorScheme";
import { useSupabase } from "@/context/supabase-provider";
import { H2 } from "@/components/ui/typography";

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
	const { columnCount, updateColumnCount } = useColumnPreference();

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

			{/* <View className="w-full items-center justify-center py-4">
				<H2>{activeOrganization?.name}'s gemstones</H2>
			</View> */}

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
