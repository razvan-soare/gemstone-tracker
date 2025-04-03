import {
	GemstoneColor,
	GemstoneOwner,
	GemstoneShape,
	GemstoneSize,
} from "@/app/types/gemstone";
import { colors } from "@/constants/colors";
import { useOrganizationOwners } from "@/hooks/useOrganizationOwners";
import { useColorScheme } from "@/lib/useColorScheme";
import { useLanguage } from "@/hooks/useLanguage";
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

export type FilterDrawerProps = {
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
	const { owners, addOwner } = useOrganizationOwners();
	const { t } = useLanguage();

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

	const ownerOptions = owners.map((owner) => ({
		id: owner.name,
		title: owner.name,
	}));

	return (
		<Portal>
			<Modal
				visible={visible}
				onDismiss={onDismiss}
				contentContainerStyle={[
					styles.modalContent,
					{ backgroundColor: backgroundColor },
				]}
			>
				<View style={styles.header}>
					<Text
						variant="titleLarge"
						style={[styles.title, { color: textColor }]}
					>
						{t("gemstones.filters")}
					</Text>
					<Button onPress={handleReset}>{t("gemstones.resetFilters")}</Button>
				</View>

				<Divider />

				{/* Active filters */}
				<View style={styles.activeFiltersContainer}>
					{currentFilters.shape && (
						<Chip
							mode="outlined"
							onClose={() => removeFilter("shape")}
							style={styles.filterChip}
						>
							{t("gemstones.shape")}: {currentFilters.shape}
						</Chip>
					)}
					{currentFilters.color && (
						<Chip
							mode="outlined"
							onClose={() => removeFilter("color")}
							style={styles.filterChip}
						>
							{t("gemstones.color")}: {currentFilters.color}
						</Chip>
					)}
					{currentFilters.size && (
						<Chip
							mode="outlined"
							onClose={() => removeFilter("size")}
							style={styles.filterChip}
						>
							{t("gemstones.size")}: {currentFilters.size}
						</Chip>
					)}
					{currentFilters.owner && (
						<Chip
							mode="outlined"
							onClose={() => removeFilter("owner")}
							style={styles.filterChip}
						>
							{t("gemstones.owner")}: {currentFilters.owner}
						</Chip>
					)}
					{currentFilters.sold === true && (
						<Chip
							mode="outlined"
							onClose={() => removeFilter("sold")}
							style={styles.filterChip}
						>
							{t("gemstones.soldOnly")}
						</Chip>
					)}
				</View>

				<ScrollView style={styles.scrollView}>
					<View style={styles.dropdownContainer}>
						<ComboBox
							label={t("gemstones.shape")}
							placeholder={t("gemstones.selectShape")}
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
							label={t("gemstones.color")}
							placeholder={t("gemstones.selectColor")}
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
							label={t("gemstones.size")}
							placeholder={t("gemstones.selectSize")}
							value={currentFilters.size || ""}
							options={sizeOptions}
							onChange={(value) => updateFilter("size", value as GemstoneSize)}
							allowCustom
						/>
					</View>

					<View style={styles.dropdownContainer}>
						<ComboBox
							label={t("gemstones.owner")}
							placeholder={t("gemstones.selectOwner")}
							value={currentFilters.owner || ""}
							options={ownerOptions}
							onChange={(value) =>
								updateFilter("owner", value as GemstoneOwner)
							}
							allowCustom
							onCreateNewOption={async (value) => {
								await addOwner.mutateAsync(value);
							}}
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
	modalContent: {
		margin: 20,
		borderRadius: 8,
		height: "80%",
		width: "90%",
		alignSelf: "center",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
	},
	title: {
		fontWeight: "bold",
	},
	activeFiltersContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		padding: 8,
		gap: 8,
	},
	filterChip: {
		marginRight: 8,
		marginBottom: 8,
	},
	scrollView: {
		flex: 1,
		padding: 16,
	},
	dropdownContainer: {
		marginBottom: 16,
	},
	switchContainer: {
		marginTop: 8,
	},
	switchRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginVertical: 8,
	},
	footer: {
		padding: 16,
		alignItems: "flex-end",
	},
	doneButton: {
		width: 100,
	},
});
