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

type GemstoneListProps = {
	gemstones: Array<Tables<"stones"> & { images: Tables<"images">[] }>;
	isLoading: boolean;
	onLoadMore: () => void;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
};

const GemstoneList = ({
	gemstones,
	isLoading,
	onLoadMore,
	hasNextPage,
	isFetchingNextPage,
}: GemstoneListProps) => {
	const windowWidth = Dimensions.get("window").width;
	const padding = 16;
	const spacing = 16;
	const availableWidth = windowWidth - padding * 2;
	const columnWidth = (availableWidth - spacing) / 2;

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
			numColumns={2}
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
