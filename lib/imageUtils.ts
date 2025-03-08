import { supabase } from "@/config/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
import { Tables } from "./database.types";

// Function to get signed URLs with caching
export async function getSignedImageUrl(
	pictureUrl: string,
): Promise<string | null> {
	if (!pictureUrl) {
		return null;
	}
	try {
		// Get signed URL for original
		const { data: originalData, error: originalError } = await supabase.storage
			.from("tus")
			.createSignedUrl(pictureUrl, 60 * 60 * 24); // 24 hours

		if (originalError) throw originalError;

		return originalData.signedUrl;
	} catch (error) {
		console.error("Error getting signed URL:", pictureUrl, error);
		return null;
	}
}

/**
 * A hook that uses React Query to fetch and cache optimized image sources
 *
 * @param imageUrl The original image URL to optimize
 * @param options Optional React Query options
 * @returns An object containing the optimized image source and loading state
 */
export function useImage(image: Tables<"images">, options = {}) {
	const queryKey = ["image", image?.id];

	const query = useQuery({
		queryKey,
		queryFn: async () => {
			if (!image) return null;
			return {
				source: await getOptimizedImageSource({
					src: image.medium || "",
					cache: false,
				}),
				thumbnail: await getOptimizedImageSource({
					src: image.thumbnail || "",
					cache: true,
				}),
			};
		},
		staleTime: 1000 * 60 * 60, // 1 hour
		enabled: !!image,
		...options,
	});

	return {
		source: query.data?.source,
		thumbnail: query.data?.thumbnail,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}

// Function to cache remote images locally
export async function cacheImageLocally(remoteUrl: string, localUri?: string) {
	try {
		const cacheKey = `image_cache_${remoteUrl.split("/").pop()}`;

		// If we already have a local URI, store it
		if (localUri) {
			await AsyncStorage.setItem(cacheKey, localUri);
			return localUri;
		}

		// Check if we have this image cached
		const cachedUri = await AsyncStorage.getItem(cacheKey);
		if (cachedUri) {
			// Verify the file exists
			const fileInfo = await FileSystem.getInfoAsync(cachedUri);
			if (fileInfo.exists) return cachedUri;
		}

		// Download and cache the file
		const imageUrl = await getSignedImageUrl(remoteUrl);
		if (!imageUrl) return null;
		const fileUri = `${FileSystem.cacheDirectory}${remoteUrl.split("/").pop()}`;
		await FileSystem.downloadAsync(imageUrl, fileUri);
		await AsyncStorage.setItem(cacheKey, fileUri);
		return fileUri;
	} catch (error) {
		console.error("Error caching image:", error);
		return null;
	}
}

export async function getOptimizedImageSource({
	src,
	cache = false,
}: {
	src: string;
	cache?: boolean;
}) {
	if (cache) {
		const cachedUri = await cacheImageLocally(src);
		if (cachedUri) return cachedUri;
	}

	return await getSignedImageUrl(src);
}

export const getDefaultStoneImage = () => {
	return "https://placehold.co/1x1?text=No-image";
};
