import React from "react";
import { StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-paper-dropdown";
import { H3, Muted } from "./ui/typography";
import { useColumnPreference } from "@/hooks/useColumnPreference";

export const ColumnPreferences = () => {
	const { columnCount, updateColumnCount } = useColumnPreference();

	const columnOptions = [1, 2, 3, 4, 5].map((count) => ({
		label: `${count} Column${count > 1 ? "s" : ""}`,
		value: count.toString(),
	}));

	return (
		<View style={styles.container}>
			<H3>Gemstone List Layout</H3>
			<Muted>Select how many columns to display in the gemstone list</Muted>

			<View style={styles.dropdownContainer}>
				<Dropdown
					label="Select Columns"
					mode="outlined"
					hideMenuHeader
					menuContentStyle={{ top: 60 }}
					value={columnCount.toString()}
					onSelect={(value) => {
						if (!value) return;
						updateColumnCount(parseInt(value));
					}}
					options={columnOptions}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		gap: 8,
		marginBottom: 24,
	},
	dropdownContainer: {
		marginTop: 8,
	},
});
