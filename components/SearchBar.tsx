import { StyleSheet } from "react-native";
import { Searchbar } from "react-native-paper";

const SearchBar = ({
	searchQuery,
	setSearchQuery,
}: {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
}) => {
	return (
		<Searchbar
			placeholder="Search gemstones"
			onChangeText={setSearchQuery}
			value={searchQuery}
			style={styles.searchBar}
		/>
	);
};

const styles = StyleSheet.create({
	searchBar: {
		margin: 16,
		elevation: 4,
	},
});

export default SearchBar;
