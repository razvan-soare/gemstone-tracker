import { supabase } from "@/config/supabase";
import { colors } from "@/constants/colors";
import { Tables } from "@/lib/database.types";
import { getDefaultStoneImage } from "@/lib/imageUtils";
import { useColorScheme } from "@/lib/useColorScheme";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import {
	Dimensions,
	Modal,
	StatusBar,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import { ActivityIndicator, IconButton } from "react-native-paper";
import { useSharedValue } from "react-native-reanimated";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { OptimizedImage } from "./OptimizedImage";

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
	onAddImage?: () => void;
}

// Full-size image viewer component
const ImageViewer = ({
	visible,
	onClose,
	item,
	allItems,
	initialIndex,
	placeholder,
}: {
	visible: boolean;
	onClose: () => void;
	item: CarouselItem | null;
	allItems: CarouselItem[];
	initialIndex: number;
	placeholder: string;
}) => {
	const { colorScheme } = useColorScheme();
	const screenWidth = Dimensions.get("window").width;
	const screenHeight = Dimensions.get("window").height;
	const [activeIndex, setActiveIndex] = useState(initialIndex);
	const carouselRef = useRef<ICarouselInstance>(null);

	// Reset the active index when the modal opens
	React.useEffect(() => {
		if (visible) {
			setActiveIndex(initialIndex);
		}
	}, [visible, initialIndex]);

	if (!item || allItems.length === 0) return null;

	return (
		<Modal
			visible={visible}
			transparent={true}
			animationType="fade"
			onRequestClose={onClose}
		>
			<StatusBar hidden />
			<View
				style={[
					styles.modalContainer,
					{
						backgroundColor:
							colorScheme === "dark" ? "rgba(0,0,0,0.9)" : "rgba(0,0,0,0.8)",
					},
				]}
			>
				<IconButton
					icon="close"
					size={24}
					iconColor="#fff"
					style={styles.closeButton}
					onPress={onClose}
				/>

				<View style={styles.fullscreenCarouselContainer}>
					<Carousel
						ref={carouselRef}
						loop
						width={screenWidth}
						height={screenHeight * 0.8}
						data={allItems}
						scrollAnimationDuration={300}
						onSnapToItem={(index) => {
							setActiveIndex(index);
						}}
						defaultIndex={initialIndex}
						renderItem={({ item }) => (
							<View style={styles.fullscreenItemContainer}>
								{item.type === "image" ? (
									<FullSizeImageItem
										image={item.data}
										placeholder={placeholder}
									/>
								) : (
									<Image
										source={{ uri: item.data.uri }}
										placeholder={placeholder}
										style={styles.fullSizeImage}
										contentFit="contain"
									/>
								)}
							</View>
						)}
					/>
				</View>

				{allItems.length > 1 && (
					<View style={styles.fullscreenPaginationContainer}>
						{allItems.map((_, index) => (
							<View
								key={index}
								style={[
									styles.paginationDot,
									{
										width: index === activeIndex ? 12 : 8,
										height: index === activeIndex ? 12 : 8,
										backgroundColor:
											activeIndex === index
												? "#ffffff"
												: "rgba(255, 255, 255, 0.5)",
									},
								]}
							/>
						))}
					</View>
				)}
			</View>
		</Modal>
	);
};

// Component to handle loading the full-size image
const FullSizeImageItem = ({
	image,
	placeholder,
}: {
	image: Tables<"images">;
	placeholder: string;
}) => {
	const { colorScheme } = useColorScheme();
	const [loading, setLoading] = useState(true);
	const [imageUrl, setImageUrl] = useState<string | null>(null);

	// Function to get the original image URL
	const getOriginalImageUrl = async (image: Tables<"images">) => {
		try {
			if (!image.original) return null;
			const { data, error } = await supabase.storage
				.from("tus")
				.createSignedUrl(image.original, 60 * 60); // 1 hour expiry

			if (error) throw error;
			return data.signedUrl;
		} catch (error) {
			console.error("Error getting original image URL:", error);
			return null;
		}
	};

	// Effect to fetch the original image URL when the component mounts
	React.useEffect(() => {
		setLoading(true);
		getOriginalImageUrl(image).then((url) => {
			setImageUrl(url);
			setLoading(false);
		});
	}, [image]);

	return (
		<View style={styles.fullSizeImageContainer}>
			{loading && (
				<ActivityIndicator
					size="large"
					color={colorScheme === "dark" ? "#ffffff" : "#0000ff"}
				/>
			)}

			{!loading && imageUrl && (
				<OptimizedImage
					image={image}
					placeholder={getDefaultStoneImage()}
					style={styles.fullSizeImage}
					contentFit="contain"
				/>
			)}

			{!loading && !imageUrl && placeholder && (
				<OptimizedImage
					image={image}
					placeholder={getDefaultStoneImage()}
					style={styles.fullSizeImage}
					contentFit="contain"
				/>
			)}
		</View>
	);
};

export const GemstoneCarousel: React.FC<GemstoneCarouselProps> = ({
	images,
	tempImagePreviews = [],
	width = Dimensions.get("window").width - 30,
	height = 250,
	onAddImage,
}) => {
	const { colorScheme } = useColorScheme();
	const backgroundColor =
		colorScheme === "dark" ? colors.dark.muted : colors.light.muted;

	const allItems: CarouselItem[] = [
		...images.map((image) => ({ type: "image", data: image }) as ImageItem),
		...tempImagePreviews.map(
			(preview) => ({ type: "preview", data: preview }) as PreviewItem,
		),
	];

	const carouselRef = useRef<ICarouselInstance>(null);
	const progressValue = useSharedValue<number>(0);
	const [activeIndex, setActiveIndex] = useState(0);

	// State for the image viewer modal
	const [imageViewerVisible, setImageViewerVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Function to handle image press
	const handleImagePress = (item: CarouselItem, index: number) => {
		setSelectedItem(item);
		setSelectedIndex(index);
		setImageViewerVisible(true);
	};

	// If there are no images, show a placeholder with an upload button overlay
	if (allItems.length === 0) {
		return (
			<TouchableOpacity
				onPress={onAddImage}
				style={[
					styles.placeholderContainer,
					{
						width,
						height,
						backgroundColor,
					},
				]}
			>
				<Image
					source={getDefaultStoneImage()}
					style={styles.placeholderImage}
					contentFit="cover"
				/>
				<View style={styles.uploadOverlay}>
					<IconButton icon="camera-plus" size={40} iconColor="#fff" />
				</View>
			</TouchableOpacity>
		);
	}

	return (
		<View style={{ width, height }}>
			<Carousel
				ref={carouselRef}
				loop
				width={width}
				height={height}
				autoPlay={false}
				data={allItems}
				scrollAnimationDuration={1000}
				onProgressChange={(_, absoluteProgress) => {
					progressValue.value = absoluteProgress;
				}}
				onSnapToItem={(index) => {
					setActiveIndex(index);
				}}
				renderItem={({ item, index }) => (
					<TouchableOpacity
						style={[styles.itemContainer, { backgroundColor }]}
						onPress={() => handleImagePress(item, index)}
						activeOpacity={0.9}
					>
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
									contentFit="cover"
								/>
								<View style={styles.loadingOverlay}>
									<ActivityIndicator
										size="small"
										color={colorScheme === "dark" ? "#ffffff" : "#0000ff"}
									/>
								</View>
							</View>
						)}
					</TouchableOpacity>
				)}
			/>

			{allItems.length > 1 && (
				<View style={styles.paginationContainer}>
					{allItems.map((_, index) => (
						<View
							key={index}
							style={[
								styles.paginationDot,
								{
									backgroundColor:
										activeIndex === index
											? colorScheme === "dark"
												? colors.light.primary
												: colors.dark.primary
											: colorScheme === "dark"
												? "rgba(255, 255, 255, 0.3)"
												: "rgba(0, 0, 0, 0.3)",
								},
							]}
						/>
					))}
				</View>
			)}

			{/* Image Viewer Modal */}
			<ImageViewer
				visible={imageViewerVisible}
				onClose={() => setImageViewerVisible(false)}
				item={selectedItem}
				allItems={allItems}
				initialIndex={selectedIndex}
				placeholder={getDefaultStoneImage()}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	emptyContainer: {
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
	},
	emptyImage: {
		width: "100%",
		height: "100%",
		borderRadius: 8,
	},
	itemContainer: {
		flex: 1,
		justifyContent: "center",
		borderRadius: 8,
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
		borderRadius: 8,
	},
	loadingOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
	},
	paginationContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		bottom: 10,
		left: 0,
		right: 0,
	},
	paginationDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginHorizontal: 4,
	},
	// Image viewer modal styles
	modalContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	closeButton: {
		position: "absolute",
		top: 40,
		right: 20,
		zIndex: 10,
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	imageContainer: {
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		height: "100%",
	},
	fullSizeImage: {
		width: "100%",
		height: "100%",
	},
	fullSizeImageContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
	},
	fullscreenCarouselContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
	},
	fullscreenItemContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		width: "100%",
		height: "100%",
	},
	fullscreenPaginationContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		bottom: 40,
		left: 0,
		right: 0,
	},
	placeholderContainer: {
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		overflow: "hidden",
	},
	placeholderImage: {
		width: "100%",
		height: "100%",
	},
	uploadOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		alignItems: "center",
	},
});
