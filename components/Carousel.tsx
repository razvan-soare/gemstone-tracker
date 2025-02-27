import { Tables } from "@/lib/database.types";
import { getDefaultStoneImage } from "@/lib/imageUtils";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { OptimizedImage } from "./OptimizedImage";
import {
	Extrapolation,
	interpolate,
	useSharedValue,
} from "react-native-reanimated";

type ImageItem = {
	type: "image";
	data: Tables<"images">;
};

type PreviewItem = {
	type: "preview";
	data: ImagePicker.ImagePickerAsset;
};

type CarouselItem = ImageItem | PreviewItem;

interface GemstoneCarouselProps {
	images: Tables<"images">[];
	tempImagePreviews?: ImagePicker.ImagePickerAsset[];
	width?: number;
	height?: number;
}

// Helper function to apply anchor point transformation
const withAnchorPoint = (
	transform: { transform: any[] },
	anchorPoint: { x: number; y: number },
	size: { width: number; height: number },
) => {
	"worklet";

	// Convert the anchor point to a value between -0.5 and 0.5
	const anchorPointX = anchorPoint.x - 0.5;
	const anchorPointY = anchorPoint.y - 0.5;

	// Calculate the translation offset based on the anchor point
	const translateX = anchorPointX * size.width;
	const translateY = anchorPointY * size.height;

	// Add the pre and post translations to the transform array
	return {
		transform: [
			{ translateX },
			{ translateY },
			...transform.transform,
			{ translateX: -translateX },
			{ translateY: -translateY },
		],
	};
};

export const GemstoneCarousel: React.FC<GemstoneCarouselProps> = ({
	images,
	tempImagePreviews = [],
	width = Dimensions.get("window").width - 30,
	height = 250,
}) => {
	const allItems: CarouselItem[] = [
		...images.map((image) => ({ type: "image", data: image }) as ImageItem),
		...tempImagePreviews.map(
			(preview) => ({ type: "preview", data: preview }) as PreviewItem,
		),
	];

	const carouselRef = useRef<ICarouselInstance>(null);
	const progressValue = useSharedValue<number>(0);

	if (allItems.length === 0) {
		return (
			<View style={[styles.emptyContainer, { width, height }]}>
				<OptimizedImage
					image={null as any}
					placeholder={getDefaultStoneImage()}
					style={styles.emptyImage}
				/>
			</View>
		);
	}

	return (
		<View
			style={{
				width: width,
				height,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Carousel
				ref={carouselRef}
				loop
				width={width}
				height={height}
				data={allItems}
				scrollAnimationDuration={600}
				onProgressChange={(progress) => {
					progressValue.value = progress;
				}}
				customAnimation={(value) => {
					"worklet";

					// Scale effect
					const scale = interpolate(
						value,
						[-2, -1, 0, 1, 2],
						[1.7, 1.2, 1, 1.2, 1.7],
						Extrapolation.CLAMP,
					);

					// Horizontal translation
					const translate = interpolate(
						value,
						[-2, -1, 0, 1, 2],
						[-width * 1.45, -width * 0.9, 0, width * 0.9, width * 1.45],
					);

					// Create the transform object
					const transform = {
						transform: [
							{ scale },
							{ translateX: translate },
							{ perspective: 150 },
							{
								rotateY: `${interpolate(
									value,
									[-1, 0, 1],
									[30, 0, -30],
									Extrapolation.CLAMP,
								)}deg`,
							},
						],
					};

					// Apply the anchor point transformation
					return withAnchorPoint(
						transform,
						{ x: 0.5, y: 0.5 },
						{ width, height },
					);
				}}
				renderItem={({ item }) => (
					<View style={styles.itemContainer}>
						{item.type === "image" ? (
							<OptimizedImage
								key={item.data.id}
								image={item.data}
								placeholder={getDefaultStoneImage()}
								style={styles.image}
							/>
						) : (
							<View style={{ position: "relative" }}>
								<Image
									source={{ uri: item.data.uri }}
									style={[styles.image, { opacity: 0.7 }]}
									resizeMode="cover"
								/>
								<View style={styles.loadingOverlay}>
									<ActivityIndicator size="small" color="#0000ff" />
								</View>
							</View>
						)}
					</View>
				)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	itemContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f5f5f5",
	},
	image: {
		width: "100%",
		height: "100%",
		borderRadius: 8,
	},
	emptyContainer: {
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f5f5f5",
		borderRadius: 8,
	},
	emptyImage: {
		width: "80%",
		height: "80%",
		opacity: 0.5,
		borderRadius: 8,
	},
	loadingOverlay: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
		zIndex: 1,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
});
