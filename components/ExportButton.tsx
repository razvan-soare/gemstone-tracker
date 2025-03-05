import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { FAB, Snackbar } from "react-native-paper";
import { useGemstones } from "@/hooks/useGemstones";
import { exportToNumbers } from "@/lib/exportToNumbers";
import ExportDialog, { ExportFilters } from "./ExportDialog";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Tables } from "@/lib/database.types";

type ExportButtonProps = {
	style?: object;
};

const ExportButton = ({ style }: ExportButtonProps) => {
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
			const filteredGemstones = filterGemstones(allGemstones, filters);

			if (filteredGemstones.length === 0) {
				setSnackbarMessage("No gemstones match the selected filters");
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
				: new Date(gemstone.created_at || Date.now());
			const isInDateRange = isWithinInterval(gemstoneDate, {
				start: startOfDay(filters.startDate),
				end: endOfDay(filters.endDate),
			});

			if (!isInDateRange) return false;

			// Filter by sold status
			if (filters.soldStatus === "sold" && !gemstone.sold_at) return false;
			if (filters.soldStatus === "unsold" && gemstone.sold_at) return false;

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
