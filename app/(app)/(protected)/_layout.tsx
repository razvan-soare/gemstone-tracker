import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";

export default function ProtectedLayout() {
	const { colorScheme } = useColorScheme();

	const iconColor =
		colorScheme === "dark" ? colors.dark.foreground : colors.light.foreground;

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor:
						colorScheme === "dark"
							? colors.dark.background
							: colors.light.background,
					height: 60,
					paddingBottom: 8,
				},
				tabBarActiveTintColor:
					colorScheme === "dark"
						? colors.dark.foreground
						: colors.light.foreground,
				tabBarShowLabel: false,
				tabBarItemStyle: {
					paddingTop: 4,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ focused }) => (
						<View style={styles.iconContainer}>
							<Ionicons
								name={focused ? "home" : "home-outline"}
								size={24}
								color={focused ? iconColor : "gray"}
							/>
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="buy-list"
				options={{
					title: "Buy List",
					tabBarIcon: ({ focused }) => (
						<View style={styles.iconContainer}>
							<Ionicons
								name={focused ? "list" : "list-outline"}
								size={24}
								color={focused ? iconColor : "gray"}
							/>
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ focused }) => (
						<View style={styles.iconContainer}>
							<Ionicons
								name={focused ? "settings" : "settings-outline"}
								size={24}
								color={focused ? iconColor : "gray"}
							/>
						</View>
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	iconContainer: {
		paddingTop: 6,
		alignItems: "center",
		justifyContent: "center",
	},
});
