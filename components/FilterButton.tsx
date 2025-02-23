"use client";

import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Menu } from "react-native-paper";

const FilterButton = ({
	setFilterShape,
}: {
	setFilterShape: (shape: string) => void;
}) => {
	const [visible, setVisible] = useState(false);

	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);

	const selectShape = (shape: string) => {
		setFilterShape(shape);
		closeMenu();
	};

	return (
		<View style={styles.container}>
			<Menu
				visible={visible}
				onDismiss={closeMenu}
				anchor={
					<Button onPress={openMenu} mode="contained" style={styles.button}>
						Filter by Shape
					</Button>
				}
			>
				<Menu.Item onPress={() => selectShape("")} title="All Shapes" />
				<Menu.Item onPress={() => selectShape("Oval")} title="Oval" />
				<Menu.Item onPress={() => selectShape("Round")} title="Round" />
				<Menu.Item onPress={() => selectShape("Rectangle")} title="Rectangle" />
				<Menu.Item onPress={() => selectShape("Princess")} title="Princess" />
			</Menu>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		marginBottom: 16,
	},
	button: {
		width: "100%",
	},
});

export default FilterButton;
