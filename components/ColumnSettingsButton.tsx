import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Menu, Text } from "react-native-paper";

type ColumnSettingsButtonProps = {
	columnCount: number;
	onColumnCountChange: (count: number) => void;
};

const ColumnSettingsButton: React.FC<ColumnSettingsButtonProps> = ({
	columnCount,
	onColumnCountChange,
}) => {
	const [menuVisible, setMenuVisible] = useState(false);

	const openMenu = () => setMenuVisible(true);
	const closeMenu = () => setMenuVisible(false);

	const handleColumnSelect = (count: number) => {
		onColumnCountChange(count);
		closeMenu();
	};

	return (
		<View style={styles.container}>
			<Menu
				visible={menuVisible}
				onDismiss={closeMenu}
				anchor={<IconButton icon="view-grid" size={24} onPress={openMenu} />}
			>
				<Menu.Item
					leadingIcon={columnCount === 1 ? "check" : undefined}
					onPress={() => handleColumnSelect(1)}
					title="1 Column"
				/>
				<Menu.Item
					leadingIcon={columnCount === 2 ? "check" : undefined}
					onPress={() => handleColumnSelect(2)}
					title="2 Columns"
				/>
				<Menu.Item
					leadingIcon={columnCount === 3 ? "check" : undefined}
					onPress={() => handleColumnSelect(3)}
					title="3 Columns"
				/>
				<Menu.Item
					leadingIcon={columnCount === 4 ? "check" : undefined}
					onPress={() => handleColumnSelect(4)}
					title="4 Columns"
				/>
				<Menu.Item
					leadingIcon={columnCount === 5 ? "check" : undefined}
					onPress={() => handleColumnSelect(5)}
					title="5 Columns"
				/>
			</Menu>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginLeft: 8,
	},
});

export default ColumnSettingsButton;
