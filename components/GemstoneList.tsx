import { Tables } from "@/lib/database.types";
import { useLanguage } from "@/hooks/useLanguage";
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
	columnCount?: number;
};

const GemstoneList = ({
	gemstones,
	isLoading,
	onLoadMore,
	hasNextPage,
	isFetchingNextPage,
	columnCount = 2,
}: GemstoneListProps) => {
	const { t } = useLanguage();
	const windowWidth = Dimensions.get("window").width;
	const padding = 16;
	const spacing = 16;
	const availableWidth = windowWidth - padding * 2;

	// Calculate column width based on the number of columns
	const totalSpacingWidth = spacing * (columnCount - 1);
	const columnWidth = (availableWidth - totalSpacingWidth) / columnCount;

	if (isLoading && !isFetchingNextPage) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
				<Text style={styles.loadingText}>{t("common.loading")}</Text>
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
			renderItem={({ item, index }) => (
				<View
					style={{
						width: columnWidth,
						marginRight: index % columnCount !== columnCount - 1 ? spacing : 0,
						marginBottom: spacing,
						flex: 1,
						maxWidth: columnWidth,
					}}
				>
					<GemstoneCard gemstone={item} />
				</View>
			)}
			keyExtractor={(item) => item.id}
			contentContainerStyle={styles.listContainer}
			numColumns={columnCount}
			key={`column-${columnCount}`}
			{...(columnCount > 1
				? {
						columnWrapperStyle: {
							...styles.columnWrapper,
							justifyContent:
								gemstones.length < columnCount ? "flex-start" : "space-between",
						},
					}
				: {})}
			onEndReached={() => {
				if (hasNextPage && !isFetchingNextPage) {
					onLoadMore();
				}
			}}
			onEndReachedThreshold={0.5}
			ListEmptyComponent={() => (
				<View style={styles.emptyContainer}>
					<Text>{t("gemstones.noGemstones")}</Text>
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
	loadingText: {
		marginTop: 10,
		color: "#666",
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
	columnWrapper: {
		flex: 1,
		justifyContent: "space-between",
		alignItems: "stretch",
	},
});

export default GemstoneList;
