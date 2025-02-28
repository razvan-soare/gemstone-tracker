import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, ScrollView, LayoutChangeEvent } from "react-native";
import {
	Button,
	Divider,
	List,
	Modal,
	Portal,
	Text,
	Menu,
	TextInput,
	Switch,
} from "react-native-paper";
import {
	GemstoneColor,
	GemstoneCut,
	GemstoneShape,
	GemstoneSize,
} from "@/app/types/gemstone";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

type FilterDrawerProps = {
	visible: boolean;
	onDismiss: () => void;
	filters: {
		shape?: GemstoneShape;
		color?: GemstoneColor;
		cut?: GemstoneCut;
		size?: GemstoneSize;
		sold?: boolean;
	};
	onApplyFilters: (filters: {
		shape?: GemstoneShape;
		color?: GemstoneColor;
		cut?: GemstoneCut;
		size?: GemstoneSize;
		sold?: boolean;
	}) => void;
};

// Custom dropdown component
function CustomDropdown<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T | undefined;
	options: { label: string; value: T }[];
	onChange: (value: T | undefined) => void;
}) {
	const [visible, setVisible] = useState(false);
	const [inputWidth, setInputWidth] = useState(0);
	const inputRef = useRef<View>(null);

	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);

	const handleLayout = (event: LayoutChangeEvent) => {
		setInputWidth(event.nativeEvent.layout.width);
	};

	return (
		<View style={styles.dropdownWrapper}>
			<Menu
				visible={visible}
				onDismiss={closeMenu}
				anchor={
					<View ref={inputRef} onLayout={handleLayout}>
						<TextInput
							label={label}
							value={value || ""}
							mode="outlined"
							onFocus={openMenu}
							showSoftInputOnFocus={false}
							right={
								<TextInput.Icon
									icon={visible ? "menu-up" : "menu-down"}
									onPress={openMenu}
								/>
							}
						/>
					</View>
				}
				style={[styles.menu, { width: inputWidth }]}
				contentStyle={styles.menuContent}
			>
				<Menu.Item
					title="None"
					onPress={() => {
						onChange(undefined);
						closeMenu();
					}}
				/>
				<Divider />
				<ScrollView style={styles.menuScrollView}>
					{options.map((option) => (
						<Menu.Item
							key={option.value}
							title={option.label}
							onPress={() => {
								onChange(option.value);
								closeMenu();
							}}
						/>
					))}
				</ScrollView>
			</Menu>
		</View>
	);
}

export default function FilterDrawer({
	visible,
	onDismiss,
	filters,
	onApplyFilters,
}: FilterDrawerProps) {
	const { colorScheme } = useColorScheme();
	const backgroundColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;

	const [tempFilters, setTempFilters] = React.useState({
		shape: filters.shape,
		color: filters.color,
		cut: filters.cut,
		size: filters.size,
		sold: filters.sold,
	});

	const handleApply = () => {
		onApplyFilters(tempFilters);
		onDismiss();
	};

	const handleReset = () => {
		setTempFilters({
			shape: undefined,
			color: undefined,
			cut: undefined,
			size: undefined,
			sold: undefined,
		});
	};

	React.useEffect(() => {
		// Update temp filters when the parent filters change
		setTempFilters({
			shape: filters.shape,
			color: filters.color,
			cut: filters.cut,
			size: filters.size,
			sold: filters.sold,
		});
	}, [filters]);

	// Create dropdown options
	const shapeOptions = Object.values(GemstoneShape).map((shape) => ({
		label: shape,
		value: shape,
	}));

	const colorOptions = Object.values(GemstoneColor).map((color) => ({
		label: color,
		value: color,
	}));

	const cutOptions = Object.values(GemstoneCut).map((cut) => ({
		label: cut,
		value: cut,
	}));

	return (
		<Portal>
			<Modal
				visible={visible}
				onDismiss={onDismiss}
				contentContainerStyle={[styles.modalContainer, { backgroundColor }]}
			>
				<View style={styles.header}>
					<Text variant="titleLarge">Filters</Text>
					<Button onPress={handleReset}>Reset</Button>
				</View>
				<Divider />

				<ScrollView style={styles.scrollView}>
					<View style={styles.dropdownContainer}>
						<CustomDropdown
							label="Select Shape"
							value={tempFilters.shape}
							options={shapeOptions}
							onChange={(value) =>
								setTempFilters((prev) => ({
									...prev,
									shape: value,
								}))
							}
						/>
					</View>

					<View style={styles.dropdownContainer}>
						<CustomDropdown
							label="Select Color"
							value={tempFilters.color}
							options={colorOptions}
							onChange={(value) =>
								setTempFilters((prev) => ({
									...prev,
									color: value,
								}))
							}
						/>
					</View>

					<View style={styles.dropdownContainer}>
						<CustomDropdown
							label="Select Cut"
							value={tempFilters.cut}
							options={cutOptions}
							onChange={(value) =>
								setTempFilters((prev) => ({
									...prev,
									cut: value,
								}))
							}
						/>
					</View>

					<View style={styles.dropdownContainer}>
						<CustomDropdown
							label="Select Size"
							value={tempFilters.size}
							options={Object.values(GemstoneSize).map((size) => ({
								label: size,
								value: size,
							}))}
							onChange={(value) =>
								setTempFilters((prev) => ({
									...prev,
									size: value,
								}))
							}
						/>
					</View>

					<View style={styles.switchContainer}>
						<View style={styles.switchRow}>
							<Text>Show only sold gemstones</Text>
							<Switch
								value={tempFilters.sold === true}
								onValueChange={(value) =>
									setTempFilters((prev) => ({
										...prev,
										sold: value ? true : undefined,
									}))
								}
							/>
						</View>
					</View>
				</ScrollView>

				<Divider />
				<View style={styles.footer}>
					<Button
						mode="outlined"
						onPress={onDismiss}
						style={styles.footerButton}
					>
						Cancel
					</Button>
					<Button
						mode="contained"
						onPress={handleApply}
						style={styles.footerButton}
					>
						Apply
					</Button>
				</View>
			</Modal>
		</Portal>
	);
}

const styles = StyleSheet.create({
	modalContainer: {
		margin: 20,
		borderRadius: 8,
		display: "flex",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
	},
	scrollView: {
		flexGrow: 1,
		padding: 16,
	},
	dropdownContainer: {
		marginBottom: 8,
		position: "relative",
		zIndex: 1,
	},
	dropdownWrapper: {
		width: "100%",
	},
	footer: {
		flexDirection: "row",
		justifyContent: "flex-end",
		padding: 16,
		gap: 8,
	},
	footerButton: {
		minWidth: 100,
	},
	menu: {
		alignSelf: "center",
	},
	menuContent: {
		maxHeight: 300,
		top: 60,
	},
	menuScrollView: {
		maxHeight: 300,
	},
	switchContainer: {
		marginBottom: 24,
	},
	switchRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 8,
	},
});
