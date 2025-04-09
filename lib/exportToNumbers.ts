import { ExportFilters } from "@/components/ExportDialog";
import { format } from "date-fns";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { Tables } from "./database.types";
import { useOrganizationOwners } from "@/hooks/useOrganizationOwners";

// Function to export gemstone data to a CSV file (Numbers-compatible)
export const exportToNumbers = async (
	gemstones: Array<Tables<"stones"> & { images: Tables<"images">[] }>,
	filters?: ExportFilters,
) => {
	try {
		// First, get all unique owners from the gemstones
		const uniqueOwners = Array.from(
			new Set(gemstones.map((gemstone) => gemstone.owner).filter(Boolean))
		).sort();
		const { owners } = useOrganizationOwners()

		// Create the header with dynamic owner columns
		const header = [
			"Date",
			"Bill Number",
			"Stone Name & Color",
			"Weight (ct)",
			"Buyer",
			"Buyer Address",
			"Sell Price",
			"Buy Price",
			"Comment",
			// Add a column for each unique owner
			...owners.map((owner) => `${owner.name}`),
		].join(",");

		// Format the data rows
		const rows = gemstones.map((gemstone) => {
			// Format date
			const date = gemstone.date ? new Date(gemstone.date) : new Date();
			const formattedDate = format(date, "dd/MM/yyyy");

			// Format stone name and color
			const stoneNameColor = `${gemstone.name}${
				gemstone.color ? ` - ${gemstone.color}` : ""
			}`;

			// Format sell price with currency
			const sellPrice = gemstone.sell_price
				? `${gemstone.sell_currency || ""} ${gemstone.sell_price}`
				: "";

			// Format buy price with currency
			const buyPrice = gemstone.buy_price
				? `${gemstone.buy_currency || ""} ${gemstone.buy_price}`
				: "";

			// Create owner columns - only the matching owner gets the buy price
			const ownerValues = owners.map((owner) =>
				gemstone.owner?.toLowerCase() === owner.name.toLowerCase() ? buyPrice : ""
			);

			// Create the row
			return [
				formattedDate,
				gemstone.bill_number || "",
				stoneNameColor,
				gemstone.weight || "",
				gemstone.buyer || "",
				gemstone.buyer_address || "",
				sellPrice,
				buyPrice,
				gemstone.comment || "",
				...ownerValues,
			]
				.map((value) => {
					// Escape quotes and wrap fields with commas, quotes, or newlines in quotes
					if (
						typeof value === "string" &&
						(value.includes(",") ||
							value.includes('"') ||
							value.includes("\n") ||
							value.includes("\r"))
					) {
						// Replace newlines with space and double up quotes for CSV escaping
						return `"${value
							.replace(/\r?\n|\r/g, " ")
							.replace(/"/g, '""')}"`;
					}
					return value;
				})
				.join(",");
		});

		// Combine header and rows
		const csvContent = [header, ...rows].join("\n");

		// Generate filename with current date and filter information
		let fileName = `gemstone_export_${format(new Date(), "dd/MM/yyyy")}`;

		// Add filter information to filename if available
		if (filters) {
			// Check if this is a selected stones export
			if (gemstones.length > 0 && gemstones.length < 10) {
				fileName += `_selected_${gemstones.length}_stones`;
			} else {
				// Add date range
				fileName += `_${format(filters.startDate, "yyyyMMdd")}-${format(filters.endDate, "yyyyMMdd")}`;

				// Add sold status
				if (filters.soldStatus !== "all") {
					fileName += `_${filters.soldStatus}`;
				}

				// Add owner
				if (filters.owner !== "all") {
					fileName += `_${filters.owner}`;
				}
			}
		}

		fileName += ".csv";

		// Create the file
		const fileUri = `${FileSystem.documentDirectory}${fileName}`;
		await FileSystem.writeAsStringAsync(fileUri, csvContent);

		// Share the file
		if (Platform.OS === "ios" || Platform.OS === "android") {
			await Sharing.shareAsync(fileUri);
		}

		return {
			success: true,
			message: `Export successful (${gemstones.length} gemstones)`,
		};
	} catch (error) {
		console.error("Export error:", error);
		return { success: false, message: "Export failed" };
	}
};
