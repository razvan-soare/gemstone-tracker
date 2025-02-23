import { Tables } from "@/lib/database.types";
import {
	FlatList,
	StyleSheet,
	ActivityIndicator,
	View,
	Text,
} from "react-native";
import GemstoneCard from "./GemstoneCard";

const GemstoneList = ({
	gemstones,
	isLoading,
}: {
	gemstones: Tables<"stones">[];
	isLoading: boolean;
}) => {
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
			renderItem={({ item }) => <GemstoneCard gemstone={item} />}
			keyExtractor={(item) => item.id}
			contentContainerStyle={styles.listContainer}
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
