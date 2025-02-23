import { router } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import { FAB, PaperProvider } from "react-native-paper";

import FilterButton from "@/components/FilterButton";
import GemstoneList from "@/components/GemstoneList";
import SearchBar from "@/components/SearchBar";
import { useGemstones } from "@/hooks/useGemstones";

export default function Home() {
	const [searchQuery, setSearchQuery] = useState("");
	const [filterShape, setFilterShape] = useState("");

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
				<SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
				<FilterButton setFilterShape={setFilterShape} />
				<GemstoneList gemstones={filteredGemstones} isLoading={isLoading} />
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
	fab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 0,
	},
});
