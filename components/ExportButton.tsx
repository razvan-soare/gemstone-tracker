import { useGemstones } from "@/hooks/useGemstones";
import { GemstoneFilter } from "@/hooks/useGemstonesByDate";
import { Tables } from "@/lib/database.types";
import { exportToNumbers } from "@/lib/exportToNumbers";
import { endOfDay, isWithinInterval, startOfDay } from "date-fns";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { FAB, Snackbar } from "react-native-paper";
import ExportDialog, { ExportFilters } from "./ExportDialog";

type ExportButtonProps = {
	style?: object;
	filter?: GemstoneFilter;
	selectedGemstoneIds?: string[];
};

const ExportButton = ({
	style,
	filter = "all",
	selectedGemstoneIds,
}: ExportButtonProps) => {
	const [isExporting, setIsExporting] = useState(false);
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState("");
	const [dialogVisible, setDialogVisible] = useState(false);

	// Fetch all gemstones for export
	const { data } = useGemstones({});

	const handleExportPress = () => {
		setDialogVisible(true);
	};

	const handleDialogDismiss = () => {
		setDialogVisible(false);
	};

	const handleExport = async (filters: ExportFilters) => {
		if (isExporting) return;

		setIsExporting(true);
		setDialogVisible(false);

		try {
			// Collect all gemstones from all pages
			const allGemstones = data?.pages.flatMap((page) => page.items) || [];

			if (allGemstones.length === 0) {
				setSnackbarMessage("No gemstones to export");
				setSnackbarVisible(true);
				setIsExporting(false);
				return;
			}

			// Apply filters
			let filteredGemstones = allGemstones;

			// If specific gemstones are selected, only export those
			if (selectedGemstoneIds && selectedGemstoneIds.length > 0) {
				filteredGemstones = filteredGemstones.filter((gemstone) =>
					selectedGemstoneIds.includes(gemstone.id),
				);
			} else {
				// Otherwise, use the normal filter logic
				filteredGemstones = filterGemstones(filteredGemstones, filters);
			}

			if (filteredGemstones.length === 0) {
				const message =
					selectedGemstoneIds && selectedGemstoneIds.length > 0
						? "No selected gemstones match the criteria"
						: "No gemstones match the selected filters";
				setSnackbarMessage(message);
				setSnackbarVisible(true);
				setIsExporting(false);
				return;
			}

			// Export the filtered data
			const result = await exportToNumbers(filteredGemstones, filters);

			// Show result message
			setSnackbarMessage(result.message);
			setSnackbarVisible(true);
		} catch (error) {
			console.error("Export error:", error);
			setSnackbarMessage("Export failed");
			setSnackbarVisible(true);
		} finally {
			setIsExporting(false);
		}
	};

	// Function to filter gemstones based on export filters
	const filterGemstones = (
		gemstones: Array<Tables<"stones"> & { images: Tables<"images">[] }>,
		filters: ExportFilters,
	) => {
		return gemstones.filter((gemstone) => {
			// Filter by date range
			const gemstoneDate = gemstone.date
				? new Date(gemstone.date)
				: new Date(gemstone.purchase_date || Date.now());
			const isInDateRange = isWithinInterval(gemstoneDate, {
				start: startOfDay(filters.startDate),
				end: endOfDay(filters.endDate),
			});

			if (!isInDateRange) return false;

			// Filter by sold status
			if (filter !== "all") {
				if (filter === "sold" && !gemstone.sold_at) return false;
				if (filter === "stock" && gemstone.sold_at) return false;
			} else {
				if (filters.soldStatus === "sold" && !gemstone.sold_at) return false;
				if (filters.soldStatus === "unsold" && gemstone.sold_at) return false;
			}

			// Filter by owner
			if (filters.owner !== "all" && gemstone.owner !== filters.owner)
				return false;

			return true;
		});
	};

	return (
		<View>
			<FAB
				icon="file-export"
				style={[styles.fab, style]}
				onPress={handleExportPress}
				loading={isExporting}
				disabled={isExporting}
			/>

			<ExportDialog
				visible={dialogVisible}
				onDismiss={handleDialogDismiss}
				onConfirm={handleExport}
				initialSoldStatus={
					filter !== "all" ? (filter === "sold" ? "sold" : "unsold") : "all"
				}
				selectedCount={selectedGemstoneIds?.length}
			/>

			<Snackbar
				visible={snackbarVisible}
				onDismiss={() => setSnackbarVisible(false)}
				duration={3000}
				action={{
					label: "Close",
					onPress: () => setSnackbarVisible(false),
				}}
			>
				{snackbarMessage}
			</Snackbar>
		</View>
	);
};

const styles = StyleSheet.create({
	fab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 0,
		borderRadius: 100,
	},
});

export default ExportButton;
