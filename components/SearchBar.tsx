import { StyleSheet, View } from "react-native";
import { Searchbar, IconButton, Portal, Dialog } from "react-native-paper";
import { P } from "./ui/typography";
import { useState } from "react";

type SearchBarProps = {
	searchQuery: string;
	setSearchQuery: (query: string) => void;
};

const SearchBar = ({ searchQuery, setSearchQuery }: SearchBarProps) => {
	const [showHelp, setShowHelp] = useState(false);
	const [isFocused, setIsFocused] = useState(false);

	return (
		<>
			<View style={styles.container}>
				<View style={styles.searchContainer}>
					<Searchbar
						placeholder="Search gemstones..."
						onChangeText={setSearchQuery}
						value={searchQuery}
						style={styles.searchBar}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
					/>
					{!isFocused && (
						<IconButton
							icon="information"
							size={20}
							onPress={() => setShowHelp(true)}
							accessibilityLabel="Search syntax help"
							accessibilityHint="Use & for AND search (e.g., 'red & round'), | for OR search (e.g., 'red | blue')"
							style={styles.infoButton}
						/>
					)}
				</View>
			</View>

			<Portal>
				<Dialog visible={showHelp} onDismiss={() => setShowHelp(false)}>
					<Dialog.Title>Search Help</Dialog.Title>
					<Dialog.Content>
						<P>
							Use & for AND search (e.g., "red & round"){"\n"}
							Use | for OR search (e.g., "red | blue")
						</P>
					</Dialog.Content>
				</Dialog>
			</Portal>
		</>
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
