import { router } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { FAB, PaperProvider } from "react-native-paper";

import {
	GemstoneColor,
	GemstoneCut,
	GemstoneShape,
} from "@/app/types/gemstone";
import FilterButton from "@/components/FilterButton";
import GemstoneList, { ViewSettings } from "@/components/GemstoneList";
import SearchBar from "@/components/SearchBar";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";
import { useGemstones } from "@/hooks/useGemstones";

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

	const { colorScheme } = useColorScheme();

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useGemstones({
			search: searchQuery,
			...filters,
		});

	const gemstones = data?.pages.flatMap((page) => page.items) ?? [];

	return (
		<PaperProvider>
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

				<View style={styles.headerButtons}>
					<SearchBar
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
					/>
					<FilterButton filters={filters} onFiltersChange={setFilters} />
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
		gap: 8,
	},
	fab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 0,
		borderRadius: 100,
	},
});
