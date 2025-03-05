import { Tables } from "@/lib/database.types";
import { useImage } from "@/lib/imageUtils";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
interface OptimizedImageProps {
	image: Tables<"images">;
	style?: any;
	placeholder?: string;
	alt?: string;
	contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

export function OptimizedImage({
	image,
	style,
	placeholder,
	alt,
	contentFit = "cover",
}: OptimizedImageProps) {
	const { thumbnail, source, isLoading } = useImage(image);
	const { colorScheme } = useColorScheme();

	const loadingBackgroundColor =
		colorScheme === "dark" ? colors.dark.muted : colors.light.muted;

	return (
		<View style={[styles.container, style]}>
			{isLoading && (
				<View
					style={[
						styles.loadingContainer,
						style,
						{ backgroundColor: loadingBackgroundColor },
					]}
				>
					<ActivityIndicator
						size="small"
						color={colorScheme === "dark" ? "#ffffff" : "#0000ff"}
					/>
				</View>
			)}
			{placeholder && !isLoading && !source && !thumbnail && (
				<ExpoImage
					source={{ uri: placeholder }}
					style={[style, styles.placeholderImage]}
					contentFit={contentFit}
					transition={200}
				/>
			)}
			{source && (
				<ExpoImage
					source={{ uri: source }}
					placeholder={{ uri: thumbnail }}
					style={[style, isLoading ? styles.hiddenImage : null]}
					contentFit={contentFit}
					transition={300}
					alt={alt}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "relative",
	},
	loadingContainer: {
		position: "absolute",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 1,
	},
	placeholderImage: {
		position: "absolute",
		zIndex: 2,
	},
	hiddenImage: {
		opacity: 0,
	},
});
