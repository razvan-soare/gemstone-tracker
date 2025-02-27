import { Tables } from "@/lib/database.types";
import { useImage } from "@/lib/imageUtils";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
interface OptimizedImageProps {
	image: Tables<"images">;
	style?: any;
	placeholder?: string;
	alt?: string;
}

export function OptimizedImage({
	image,
	style,
	placeholder,
	alt,
}: OptimizedImageProps) {
	const { thumbnail, source, isLoading } = useImage(image);

	return (
		<View style={[styles.container, style]}>
			{isLoading && (
				<View style={[styles.loadingContainer, style]}>
					<ActivityIndicator size="small" color="#0000ff" />
				</View>
			)}
			{placeholder && !isLoading && !source && !thumbnail && (
				<ExpoImage
					source={{ uri: placeholder }}
					style={[style, styles.placeholderImage]}
					contentFit="cover"
					transition={200}
				/>
			)}
			{source && (
				<ExpoImage
					source={{ uri: source }}
					placeholder={{ uri: thumbnail }}
					style={[style, isLoading ? styles.hiddenImage : null]}
					contentFit="cover"
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
		backgroundColor: "#f0f0f0",
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
