import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLUMN_PREFERENCE_KEY = "gemstone-column-preference";
const DEFAULT_COLUMN_COUNT = 2;

export const useColumnPreference = () => {
	const [columnCount, setColumnCount] = useState<number>(DEFAULT_COLUMN_COUNT);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// Load the column preference from AsyncStorage on mount
	useEffect(() => {
		const loadColumnPreference = async () => {
			try {
				const storedPreference = await AsyncStorage.getItem(
					COLUMN_PREFERENCE_KEY,
				);
				if (storedPreference !== null) {
					setColumnCount(parseInt(storedPreference, 10));
				}
			} catch (error) {
				console.error("Error loading column preference:", error);
			} finally {
				setIsLoading(false);
			}
		};

		loadColumnPreference();
	}, []);

	// Save the column preference to AsyncStorage
	const updateColumnCount = async (count: number) => {
		try {
			await AsyncStorage.setItem(COLUMN_PREFERENCE_KEY, count.toString());
			setColumnCount(count);
		} catch (error) {
			console.error("Error saving column preference:", error);
		}
	};

	return {
		columnCount,
		updateColumnCount,
		isLoading,
	};
};
