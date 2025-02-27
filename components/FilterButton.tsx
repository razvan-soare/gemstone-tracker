import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Badge, IconButton } from "react-native-paper";
import {
	GemstoneColor,
	GemstoneCut,
	GemstoneShape,
} from "@/app/types/gemstone";
import FilterDrawer from "./FilterDrawer";

type FilterButtonProps = {
	onFiltersChange: (filters: {
		shape?: GemstoneShape;
		color?: GemstoneColor;
		cut?: GemstoneCut;
	}) => void;
	filters: {
		shape?: GemstoneShape;
		color?: GemstoneColor;
		cut?: GemstoneCut;
	};
};

export default function FilterButton({
	onFiltersChange,
	filters,
}: FilterButtonProps) {
	const [visible, setVisible] = useState(false);

	const showModal = () => setVisible(true);
	const hideModal = () => setVisible(false);

	// Count active filters
	const activeFiltersCount = Object.values(filters).filter(Boolean).length;

	return (
		<>
			<View style={styles.filterButtonContainer}>
				<IconButton
					icon="filter-variant"
					mode="contained-tonal"
					onPress={showModal}
					style={styles.filterButton}
				/>
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
	},
	badge: {
		position: "absolute",
		top: -4,
		right: -4,
	},
});
