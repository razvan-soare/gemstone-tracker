import { router } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { FAB, PaperProvider } from "react-native-paper";

import FilterButton from "@/components/FilterButton";
import GemstoneList, { ViewSettings } from "@/components/GemstoneList";
import SearchBar from "@/components/SearchBar";
import ViewSettingsButton from "@/components/ViewSettingsButton";
import { useGemstones } from "@/hooks/useGemstones";

export default function Home() {
	const [searchQuery, setSearchQuery] = useState("");
	const [filterShape, setFilterShape] = useState("");
	const [viewSettings, setViewSettings] = useState<ViewSettings>({
		columnsCount: 2,
	});

	const { data: gemstones = [], isLoading } = useGemstones();

	const filteredGemstones = gemstones
		.filter((gem) => gem.name.toLowerCase().includes(searchQuery.toLowerCase()))
		.filter((gem) =>
			filterShape
				? gem.shape?.toLowerCase() === filterShape.toLowerCase()
				: true,
		);

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
					<FilterButton setFilterShape={setFilterShape} />
					<ViewSettingsButton setViewSettings={setViewSettings} />
				</View>

				<GemstoneList
					gemstones={filteredGemstones}
					isLoading={isLoading}
					viewSettings={viewSettings}
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
	},
});
