import { supabase } from "@/config/supabase";

/**
 * Normalizes a picture reference to ensure consistent object structure
 * @param picture The picture reference (string or object)
 * @returns A normalized picture object with original and sizes properties
 */
export const normalizePicture = (
	picture: string | { original: string; sizes: Record<string, string> } | any,
): { original: string; sizes: Record<string, string> } => {
	// Handle null or undefined
	if (!picture) {
		return {
			original: "",
			sizes: {
				original: "",
				thumbnail: "",
				medium: "",
			},
		};
	}

	// If it's already an object with the right structure, return it
	if (
		typeof picture === "object" &&
		picture !== null &&
		"original" in picture &&
		typeof picture.original === "string"
	) {
		// Ensure sizes object exists
		if (!picture.sizes || typeof picture.sizes !== "object") {
			picture.sizes = {
				original: picture.original,
				thumbnail: picture.original,
				medium: picture.original,
			};
		}
		return picture;
	}

	// If it's a string that looks like JSON, try to parse it
	if (
		typeof picture === "string" &&
		(picture.startsWith("{") || picture.startsWith("["))
	) {
		try {
			const parsed = JSON.parse(picture);
			if (typeof parsed === "object" && parsed !== null) {
				// If it has an original property, use it
				if ("original" in parsed && typeof parsed.original === "string") {
					// Ensure sizes object exists
					if (!parsed.sizes || typeof parsed.sizes !== "object") {
						parsed.sizes = {
							original: parsed.original,
							thumbnail: parsed.original,
							medium: parsed.original,
						};
					}
					return parsed;
				}

				// If it doesn't have an original property but has a string property we can use
				for (const key in parsed) {
					if (typeof parsed[key] === "string") {
						return {
							original: parsed[key],
							sizes: {
								original: parsed[key],
								thumbnail: parsed[key],
								medium: parsed[key],
							},
						};
					}
				}
			}
		} catch (e) {
			// If parsing fails, treat it as a simple string path
		}
	}

	// For string paths
	const stringPath = typeof picture === "string" ? picture : "";

	// Otherwise, treat it as a simple string path
	return {
		original: stringPath,
		sizes: {
			original: stringPath,
			thumbnail: stringPath,
			medium: stringPath,
		},
	};
};

/**
 * Gets signed URLs for gemstone pictures, handling both old format (string) and new format (object with sizes)
 * @param pictures Array of picture references from the gemstone object
 * @param expiresIn Expiration time in seconds for the signed URLs (default: 3600)
 * @returns A record mapping original paths to their signed URLs (with size variants)
 */
export const getSignedImageUrls = async (
	pictures: (string | { original: string; sizes: Record<string, string> })[],
	expiresIn: number = 3600,
): Promise<Record<string, Record<string, string>>> => {
	if (!pictures?.length) return {};

	const urls: Record<string, Record<string, string>> = {};

	for (const rawPicture of pictures) {
		// Normalize the picture to ensure consistent structure
		const picture = normalizePicture(rawPicture);

		// Process each size
		const sizeUrls: Record<string, string> = {};
		for (const [size, path] of Object.entries(picture.sizes)) {
			if (typeof path === "string" && path.startsWith("http")) {
				sizeUrls[size] = path;
				continue;
			}

			const { data } = await supabase.storage
				.from("tus")
				.createSignedUrl(path as string, expiresIn);

			if (data?.signedUrl) {
				sizeUrls[size] = data.signedUrl;
			}
		}
		urls[picture.original] = sizeUrls;
	}

	return urls;
};

/**
 * Gets the best image URL to display for a gemstone
 * @param signedUrls Record of signed URLs for pictures
 * @param pictures Array of picture references
 * @param size The desired image size ('thumbnail', 'medium', or 'original')
 * @param defaultImage Fallback image URL if no images are available
 * @returns The URL of the first image at the requested size, or the default image
 */
export const getGemstoneImageUrl = (
	signedUrls: Record<string, Record<string, string>>,
	pictures: (string | { original: string; sizes: Record<string, string> })[],
	size: "thumbnail" | "medium" | "original" = "medium",
	defaultImage: string = "https://place-hold.it/300x300.jpg/666/fff/000",
): string => {
	if (!pictures?.length) return defaultImage;

	// Get the first picture and normalize it
	const normalizedPicture = normalizePicture(pictures[0]);

	// Get the signed URLs for this image
	const imageUrls = signedUrls[normalizedPicture.original];
	if (!imageUrls) return defaultImage;

	// Return the requested size, falling back to original if not available
	return imageUrls[size] || imageUrls.original || defaultImage;
};
