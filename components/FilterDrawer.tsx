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

	// We no longer need tempFilters since we apply directly
	// Instead, we'll work directly with the filters from props
	const [currentFilters, setCurrentFilters] = React.useState({
		shape: filters.shape,
		color: filters.color,
		size: filters.size,
		sold: filters.sold,
		owner: filters.owner,
	});

	// Update filters when a change is made
	const updateFilter = <K extends keyof typeof currentFilters>(
		key: K,
		value: (typeof currentFilters)[K],
	) => {
		const newFilters = {
			...currentFilters,
			[key]: value,
		};
		setCurrentFilters(newFilters);
		onApplyFilters(newFilters);
	};

	const handleReset = () => {
		const resetFilters = {
			shape: undefined,
			color: undefined,
			size: undefined,
			sold: undefined,
			owner: undefined,
		};
		setCurrentFilters(resetFilters);
		onApplyFilters(resetFilters);
	};

	const removeFilter = (filterKey: keyof typeof currentFilters) => {
		updateFilter(filterKey, undefined);
	};

	React.useEffect(() => {
		// Update current filters when the parent filters change
		setCurrentFilters({
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
	const activeFilters = Object.entries(currentFilters)
		.filter(([_, value]) => !!value)
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
									onPress={() =>
										removeFilter(key as keyof typeof currentFilters)
									}
									onClose={() =>
										removeFilter(key as keyof typeof currentFilters)
									}
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
							value={currentFilters.shape || ""}
							options={shapeOptions}
							onChange={(value) =>
								updateFilter("shape", value as GemstoneShape)
							}
							allowCustom
						/>
					</View>

					<View style={styles.dropdownContainer}>
						<ComboBox
							label="Color"
							placeholder="Select Color"
							value={currentFilters.color || ""}
							options={colorOptions}
							onChange={(value) =>
								updateFilter("color", value as GemstoneColor)
							}
							allowCustom
						/>
					</View>

					<View style={styles.dropdownContainer}>
						<ComboBox
							label="Size"
							placeholder="Select Size"
							value={currentFilters.size || ""}
							options={sizeOptions}
							onChange={(value) => updateFilter("size", value as GemstoneSize)}
							allowCustom
						/>
					</View>

					<View style={styles.dropdownContainer}>
						<ComboBox
							label="Owner"
							placeholder="Select Owner"
							value={currentFilters.owner || ""}
							options={ownerOptions}
							onChange={(value) =>
								updateFilter("owner", value as GemstoneOwner)
							}
							allowCustom
						/>
					</View>

					<View style={styles.switchContainer}>
						<View style={styles.switchRow}>
							<Text>Show only sold gemstones</Text>
							<Switch
								value={currentFilters.sold === true}
								onValueChange={(value) =>
									updateFilter("sold", value ? true : undefined)
								}
							/>
						</View>
					</View>
				</ScrollView>

				<Divider />
				<View style={styles.footer}>
					<Button
						mode="contained"
						onPress={onDismiss}
						style={styles.doneButton}
					>
						Done
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
		justifyContent: "center",
		padding: 16,
	},
	doneButton: {
		minWidth: 120,
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
