import { StyleSheet, View } from "react-native";
import { Searchbar } from "react-native-paper";
import { P } from "./ui/typography";

type SearchBarProps = {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
};

const SearchBar = ({ searchQuery, setSearchQuery }: SearchBarProps) => {
	return (
		<View style={styles.container}>
			<Searchbar
				placeholder="Search gemstones..."
				onChangeText={setSearchQuery}
				value={searchQuery}
				style={styles.searchBar}
			/>
			<P style={styles.helperText}>
				Use & for AND search (e.g., "red & round"), | for OR search (e.g., "red
				| blue")
			</P>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 4,
	},
	searchBar: {
		elevation: 0,
	},
	helperText: {
		color: "#666",
		fontSize: 12,
	},
});

export default SearchBar;
