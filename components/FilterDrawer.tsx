import {
	GemstoneColor,
	GemstoneOwner,
	GemstoneShape,
	GemstoneSize,
} from "@/app/types/gemstone";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
	Button,
	Chip,
	Divider,
	Modal,
	Portal,
	Switch,
	Text,
} from "react-native-paper";
import { ComboBox } from "./ui/combobox";

type FilterDrawerProps = {
	visible: boolean;
	onDismiss: () => void;
	filters: {
		shape?: GemstoneShape;
		color?: GemstoneColor;
		size?: GemstoneSize;
		sold?: boolean;
		owner?: GemstoneOwner;
	};
	onApplyFilters: (filters: {
		shape?: GemstoneShape;
		color?: GemstoneColor;
		size?: GemstoneSize;
		sold?: boolean;
		owner?: GemstoneOwner;
	}) => void;
};

export default function FilterDrawer({
	visible,
	onDismiss,
	filters,
	onApplyFilters,
}: FilterDrawerProps) {
	const { colorScheme } = useColorScheme();
	const backgroundColor =
		colorScheme === "dark" ? colors.dark.background : colors.light.background;
	const textColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;

	const [tempFilters, setTempFilters] = React.useState({
		shape: filters.shape,
		color: filters.color,
		size: filters.size,
		sold: filters.sold,
		owner: filters.owner,
	});

	const handleApply = () => {
		onApplyFilters(tempFilters);
		onDismiss();
	};

	const handleReset = () => {
		setTempFilters({
			shape: undefined,
			color: undefined,
			size: undefined,
			sold: undefined,
			owner: undefined,
		});
	};

	const removeFilter = (filterKey: keyof typeof tempFilters) => {
		setTempFilters((prev) => ({
			...prev,
			[filterKey]: undefined,
		}));
	};

	React.useEffect(() => {
		// Update temp filters when the parent filters change
		setTempFilters({
			shape: filters.shape,
			color: filters.color,
			size: filters.size,
			sold: filters.sold,
			owner: filters.owner,
		});
	}, [filters]);

	// Create dropdown options
	const shapeOptions = Object.values(GemstoneShape).map((shape) => ({
		id: shape,
		title: shape,
	}));

	const colorOptions = Object.values(GemstoneColor).map((color) => ({
		id: color,
		title: color,
	}));

	const sizeOptions = Object.values(GemstoneSize).map((size) => ({
		id: size,
		title: size,
	}));

	const ownerOptions = Object.values(GemstoneOwner).map((owner) => ({
		id: owner,
		title: owner,
	}));

	// Get active filters for chips
	const activeFilters = Object.entries(tempFilters)
		.filter(([_, value]) => value !== undefined)
		.map(([key, value]) => {
			if (key === "sold" && value === true) {
				return { key, label: "Sold Only" };
			}
			return { key, label: value as string };
		});

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

				{activeFilters.length > 0 && (
					<View style={styles.chipsContainer}>
						<Text style={[styles.chipsLabel, { color: textColor }]}>
							Active Filters:
						</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.chipsScrollView}
						>
							{activeFilters.map(({ key, label }) => (
								<Chip
									key={key}
									mode="outlined"
									onPress={() => removeFilter(key as keyof typeof tempFilters)}
									onClose={() => removeFilter(key as keyof typeof tempFilters)}
									style={styles.chip}
									textStyle={styles.chipText}
									compact
									closeIcon="close-circle"
									elevated={false}
								>
									{label}
								</Chip>
							))}
						</ScrollView>
					</View>
				)}

				<ScrollView style={styles.scrollView}>
					<View style={styles.dropdownContainer}>
						<ComboBox
							label="Shape"
							placeholder="Select Shape"
							value={tempFilters.shape || ""}
							options={shapeOptions}
							onChange={(value) =>
								setTempFilters((prev) => ({
									...prev,
									shape: value as GemstoneShape,
								}))
							}
							allowCustom
						/>
					</View>

					<View style={styles.dropdownContainer}>
						<ComboBox
							label="Color"
							placeholder="Select Color"
							value={tempFilters.color || ""}
							options={colorOptions}
							onChange={(value) =>
								setTempFilters((prev) => ({
									...prev,
									color: value as GemstoneColor,
								}))
							}
							allowCustom
						/>
					</View>

					<View style={styles.dropdownContainer}>
						<ComboBox
							label="Size"
							placeholder="Select Size"
							value={tempFilters.size || ""}
							options={sizeOptions}
							onChange={(value) =>
								setTempFilters((prev) => ({
									...prev,
									size: value as GemstoneSize,
								}))
							}
							allowCustom
						/>
					</View>

					<View style={styles.dropdownContainer}>
						<ComboBox
							label="Owner"
							placeholder="Select Owner"
							value={tempFilters.owner || ""}
							options={ownerOptions}
							onChange={(value) =>
								setTempFilters((prev) => ({
									...prev,
									owner: value as GemstoneOwner,
								}))
							}
							allowCustom
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
		marginBottom: 16,
		position: "relative",
		zIndex: 1,
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
	switchContainer: {
		marginBottom: 24,
	},
	switchRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 8,
	},
	chipsContainer: {
		padding: 16,
		paddingBottom: 0,
	},
	chipsLabel: {
		marginBottom: 8,
		fontWeight: "500",
	},
	chipsScrollView: {
		flexDirection: "row",
	},
	chip: {
		marginRight: 8,
		marginBottom: 8,
		height: 32,
		paddingVertical: 0,
		paddingHorizontal: 0,
	},
	chipText: {
		fontSize: 12,
	},
});
