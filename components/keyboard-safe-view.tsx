import React from "react";
import {
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	ViewStyle,
} from "react-native";
import { SafeAreaView } from "./safe-area-view";
import { Edge } from "react-native-safe-area-context";

interface KeyboardSafeViewProps {
	children: React.ReactNode;
	behavior?: "padding" | "height" | "position";
}

export const KeyboardSafeView: React.FC<KeyboardSafeViewProps> = ({
	children,
	behavior = Platform.OS === "ios" ? "padding" : "height",
}) => {
	return (
		<KeyboardAvoidingView className="flex-1" behavior={behavior}>
			{children}
		</KeyboardAvoidingView>
	);
};
