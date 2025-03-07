import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Stack } from "expo-router";

import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { AutocompleteDropdownContextProvider } from "react-native-autocomplete-dropdown";

export const unstable_settings = {
	initialRouteName: "(root)",
};

export default function AppLayout() {
	const { colorScheme } = useColorScheme();

	// Create custom themes that match our color palette
	const lightTheme = {
		...MD3LightTheme,
		colors: {
			...MD3LightTheme.colors,
			primary: colors.light.primary,
			background: colors.light.background,
			surface: colors.light.background,
			surfaceVariant: colors.light.muted,
			onSurface: colors.light.foreground,
			onSurfaceVariant: colors.light.mutedForeground,
			outline: colors.light.border,
		},
	};

	const darkTheme = {
		...MD3DarkTheme,
		colors: {
			...MD3DarkTheme.colors,
			primary: colors.dark.primary,
			background: colors.dark.background,
			surface: colors.dark.background,
			surfaceVariant: colors.dark.muted,
			onSurface: colors.dark.foreground,
			onSurfaceVariant: colors.dark.mutedForeground,
			outline: colors.dark.border,
		},
	};

	return (
		<AutocompleteDropdownContextProvider>
			<ActionSheetProvider>
				<PaperProvider theme={colorScheme === "dark" ? darkTheme : lightTheme}>
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Screen name="welcome" />
						<Stack.Screen name="(protected)" />
						<Stack.Screen name="verify" />
						<Stack.Screen
							name="gemstone/[id]"
							options={{
								presentation: "card",
								headerShown: true,
								title: "",
								headerBackTitle: "Back",
								headerStyle: {
									backgroundColor:
										colorScheme === "dark"
											? colors.dark.background
											: colors.light.background,
								},
								headerTintColor:
									colorScheme === "dark"
										? colors.dark.foreground
										: colors.light.foreground,
								gestureEnabled: true,
							}}
						/>
						<Stack.Screen
							name="sign-up"
							options={{
								presentation: "modal",
								headerShown: true,
								headerTitle: "Sign Up",
								headerStyle: {
									backgroundColor:
										colorScheme === "dark"
											? colors.dark.background
											: colors.light.background,
								},
								headerTintColor:
									colorScheme === "dark"
										? colors.dark.foreground
										: colors.light.foreground,
								gestureEnabled: true,
							}}
						/>
						<Stack.Screen
							name="sign-in"
							options={{
								presentation: "modal",
								headerShown: true,
								headerTitle: "Sign In",
								headerStyle: {
									backgroundColor:
										colorScheme === "dark"
											? colors.dark.background
											: colors.light.background,
								},
								headerTintColor:
									colorScheme === "dark"
										? colors.dark.foreground
										: colors.light.foreground,
								gestureEnabled: true,
							}}
						/>

						<Stack.Screen
							name="add-new-gemstone"
							options={{
								headerShown: true,
								headerTitle: "Add new gemstone",
								headerStyle: {
									backgroundColor:
										colorScheme === "dark"
											? colors.dark.background
											: colors.light.background,
								},
								headerTintColor:
									colorScheme === "dark"
										? colors.dark.foreground
										: colors.light.foreground,
								gestureEnabled: true,
							}}
						/>
					</Stack>
				</PaperProvider>
			</ActionSheetProvider>
		</AutocompleteDropdownContextProvider>
	);
}
