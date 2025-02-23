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

type GemstoneListProps = {
	gemstones: Tables<"stones">[];
	isLoading: boolean;
	viewSettings: ViewSettings;
	onLoadMore: () => void;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
};

const GemstoneList = ({
	gemstones,
	isLoading,
	viewSettings,
	onLoadMore,
	hasNextPage,
	isFetchingNextPage,
}: GemstoneListProps) => {
	const windowWidth = Dimensions.get("window").width;
	const padding = 16;
	const spacing = 16;
	const availableWidth = windowWidth - padding * 2;
	const columnWidth =
		(availableWidth - spacing * (viewSettings.columnsCount - 1)) /
		viewSettings.columnsCount;

	if (isLoading && !isFetchingNextPage) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	const renderFooter = () => {
		if (!hasNextPage) return null;

		return (
			<View style={styles.footer}>
				<ActivityIndicator size="small" />
			</View>
		);
	};

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
			key={viewSettings.columnsCount}
			onEndReached={() => {
				if (hasNextPage && !isFetchingNextPage) {
					onLoadMore();
				}
			}}
			onEndReachedThreshold={0.5}
			ListEmptyComponent={() => (
				<View style={styles.emptyContainer}>
					<Text>No gemstones found</Text>
				</View>
			)}
			ListFooterComponent={renderFooter}
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
	footer: {
		padding: 16,
		alignItems: "center",
	},
});

export default GemstoneList;
