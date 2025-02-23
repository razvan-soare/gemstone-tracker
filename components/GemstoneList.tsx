import { Tables } from "@/lib/database.types";
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	StyleSheet,
	Text,
	View,
} from "react-native";
import GemstoneCard from "./GemstoneCard";

export type ViewSettings = {
	columnsCount: 1 | 2 | 3;
};

const GemstoneList = ({
	gemstones,
	isLoading,
	viewSettings,
}: {
	gemstones: Tables<"stones">[];
	isLoading: boolean;
	viewSettings: ViewSettings;
}) => {
	const windowWidth = Dimensions.get("window").width;
	const padding = 16;
	const spacing = 16;
	const availableWidth = windowWidth - padding * 2;
	const columnWidth =
		(availableWidth - spacing * (viewSettings.columnsCount - 1)) /
		viewSettings.columnsCount;

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<FlatList
			data={gemstones}
			renderItem={({ item }) => (
				<View
					style={{
						width: columnWidth,
						marginRight: spacing,
						marginBottom: spacing,
					}}
				>
					<GemstoneCard gemstone={item} />
				</View>
			)}
			keyExtractor={(item) => item.id}
			contentContainerStyle={styles.listContainer}
			numColumns={viewSettings.columnsCount}
			key={viewSettings.columnsCount} // Force re-render when columns change
			ListEmptyComponent={() => (
				<View style={styles.emptyContainer}>
					<Text>No gemstones found</Text>
				</View>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	listContainer: {
		padding: 16,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
});

export default GemstoneList;
