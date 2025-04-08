import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
import { DateTime } from "luxon";

const DISPLAY_DATE_FORMAT = "dd-MM-yyyy";

export function formatDateToDisplay(
	dateInput: Date | string | null | undefined,
): string {
	if (!dateInput) {
		return "";
	}
	let dt: DateTime;
	if (dateInput instanceof Date) {
		dt = DateTime.fromJSDate(dateInput);
	} else {
		// Attempt to parse common formats, prioritize ISO
		dt = DateTime.fromISO(dateInput);
		if (!dt.isValid) {
			// Add other formats if necessary, e.g., SQL date
			dt = DateTime.fromSQL(dateInput);
		}
	}

	if (dt.isValid) {
		return dt.toFormat(DISPLAY_DATE_FORMAT);
	}
	console.warn(`Invalid date input received: ${dateInput}`); // Optional: Log invalid dates
	return ""; // Or return 'Invalid Date' or handle as needed
}
