import { router } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { FAB, PaperProvider } from "react-native-paper";

import GemstoneList, { ViewSettings } from "@/components/GemstoneList";
import SearchBar from "@/components/SearchBar";
import ViewSettingsButton from "@/components/ViewSettingsButton";
import FilterButton from "@/components/FilterButton";
import { useGemstones } from "@/hooks/useGemstones";
import {
	GemstoneColor,
	GemstoneCut,
	GemstoneShape,
} from "@/app/types/gemstone";

export default function Home() {
	const [searchQuery, setSearchQuery] = useState("");
	const [filters, setFilters] = useState<{
		shape?: GemstoneShape;
		color?: GemstoneColor;
		cut?: GemstoneCut;
	}>({});

	const [viewSettings, setViewSettings] = useState<ViewSettings>({
		columnsCount: 2,
	});

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useGemstones({
			search: searchQuery,
			...filters,
		});

	const gemstones = data?.pages.flatMap((page) => page.items) ?? [];

	return (
		<PaperProvider>
			<SafeAreaView style={styles.container}>
				<StatusBar barStyle="dark-content" />

				<View>
					<SearchBar
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
					/>
				</View>
				<View style={styles.headerButtons}>
					<FilterButton filters={filters} onFiltersChange={setFilters} />
					<ViewSettingsButton setViewSettings={setViewSettings} />
				</View>

				<GemstoneList
					gemstones={gemstones}
					isLoading={isLoading}
					viewSettings={viewSettings}
					onLoadMore={fetchNextPage}
					hasNextPage={!!hasNextPage}
					isFetchingNextPage={isFetchingNextPage}
				/>
				<FAB
					icon="plus"
					style={styles.fab}
					onPress={() => router.push("/(app)/add-new-gemstone")}
				/>
			</SafeAreaView>
		</PaperProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	header: {
		flexDirection: "column",
		alignItems: "center",
		padding: 8,
		gap: 8,
	},
	headerButtons: {
		paddingHorizontal: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	fab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 0,
		borderRadius: 100,
	},
});
