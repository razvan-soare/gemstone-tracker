import {
	GemstoneColor,
	GemstoneOwner,
	GemstoneShape,
} from "@/app/types/gemstone";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Badge, Button, Icon } from "react-native-paper";
import FilterDrawer from "./FilterDrawer";
import { useLanguage } from "@/hooks/useLanguage";

export type FilterButtonProps = {
	onFiltersChange: (filters: {
		shape?: GemstoneShape;
		color?: GemstoneColor;
		sold?: boolean;
		owner?: GemstoneOwner;
	}) => void;
	filters: {
		shape?: GemstoneShape;
		color?: GemstoneColor;
		sold?: boolean;
		owner?: GemstoneOwner;
	};
	filterTitle?: string;
	resetLabel?: string;
	shapeLabel?: string;
	colorLabel?: string;
	sizeLabel?: string;
	ownerLabel?: string;
	soldLabel?: string;
};

export default function FilterButton({
	onFiltersChange,
	filters,
	filterTitle = "Filters",
	resetLabel,
	shapeLabel,
	colorLabel,
	sizeLabel,
	ownerLabel,
	soldLabel,
}: FilterButtonProps) {
	const [visible, setVisible] = useState(false);
	const { t } = useLanguage();

	const showModal = () => setVisible(true);
	const hideModal = () => setVisible(false);

	// Count active filters
	const activeFiltersCount = Object.values(filters).filter(Boolean).length;

	return (
		<>
			<View style={styles.filterButtonContainer}>
				<Button onPress={showModal} mode="text" style={styles.filterButton}>
					<Icon source="filter-variant" size={24} />
				</Button>
				{activeFiltersCount > 0 && (
					<Badge style={styles.badge} size={18}>
						{activeFiltersCount}
					</Badge>
				)}
			</View>

			<FilterDrawer
				visible={visible}
				onDismiss={hideModal}
				filters={filters}
				onApplyFilters={onFiltersChange}
				title={filterTitle}
				resetLabel={resetLabel}
				shapeLabel={shapeLabel}
				colorLabel={colorLabel}
				sizeLabel={sizeLabel}
				ownerLabel={ownerLabel}
				soldLabel={soldLabel}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	filterButtonContainer: {
		position: "relative",
	},
	filterButton: {
		margin: 0,
		height: 50,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		minWidth: 0,
		width: 50,
		borderRadius: 100,
	},
	badge: {
		position: "absolute",
		top: -4,
		right: -4,
	},
});
