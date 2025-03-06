import { useColorScheme as useNativewindColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

const THEME_STORAGE_KEY = "user-theme-preference";

export function useColorScheme() {
	const { colorScheme, setColorScheme, toggleColorScheme } =
		useNativewindColorScheme();

	// Load saved theme preference on initial render
	useEffect(() => {
		const loadSavedTheme = async () => {
			try {
				const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
				if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
					setColorScheme(savedTheme);
				}
			} catch (error) {
				console.error("Error loading theme preference:", error);
			}
		};

		loadSavedTheme();
	}, [setColorScheme]);

	// Custom toggle function that also saves the preference
	const toggleAndSaveColorScheme = () => {
		const newTheme = colorScheme === "dark" ? "light" : "dark";
		toggleColorScheme();

		// Save the new theme preference
		AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch((error) => {
			console.error("Error saving theme preference:", error);
		});
	};

	// Custom set function that also saves the preference
	const setAndSaveColorScheme = (theme: "dark" | "light") => {
		setColorScheme(theme);

		// Save the theme preference
		AsyncStorage.setItem(THEME_STORAGE_KEY, theme).catch((error) => {
			console.error("Error saving theme preference:", error);
		});
	};

	return {
		colorScheme: colorScheme ?? "dark",
		isDarkColorScheme: colorScheme === "dark",
		setColorScheme: setAndSaveColorScheme,
		toggleColorScheme: toggleAndSaveColorScheme,
	};
}
