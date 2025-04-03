import { StyleSheet, View } from "react-native";
import { Searchbar } from "react-native-paper";
import { useLanguage } from "@/hooks/useLanguage";

type SearchBarProps = {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
};

const SearchBar = ({ searchQuery, setSearchQuery }: SearchBarProps) => {
	const { t } = useLanguage();

	return (
		<View style={styles.searchContainer}>
			<Searchbar
				placeholder={t("gemstones.search")}
				onChangeText={setSearchQuery}
				value={searchQuery}
				style={styles.searchBar}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 4,
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		flex: 1,
	},
	searchBar: {
		flex: 1,
		elevation: 0,
	},
	infoButton: {
		margin: 0,
	},
	tooltip: {
		color: "#666",
		fontSize: 12,
	},
});

export default SearchBar;
