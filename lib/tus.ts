import { supabase } from "@/config/supabase";
import * as ImagePicker from "expo-image-picker";
import {
	ImageManipulator,
	ImageResult,
	SaveFormat,
} from "expo-image-manipulator";
import { Upload } from "tus-js-client";

const getFileExtension = (uri: string): string => {
	const match = /\.([a-zA-Z]+)$/.exec(uri);
	if (match !== null) {
		return match[1];
	}

	return "";
};

const getMimeType = (extension: string): string => {
	if (extension === "jpg") return "image/jpeg";
	return `image/${extension}`;
};

// Image size configurations
const IMAGE_SIZES = {
	thumbnail: { width: 200 },
	medium: { width: 800 },
	// Original size is preserved as-is
};

// Process image into multiple sizes
const processImage = async (
	uri: string,
): Promise<Record<string, ImageResult>> => {
	const results: Record<string, ImageResult> = {};

	// Create thumbnail version
	const thumbnailContext = await ImageManipulator.manipulate(uri);
	thumbnailContext.resize({ width: IMAGE_SIZES.thumbnail.width });
	const thumbnailImage = await thumbnailContext.renderAsync();
	results.thumbnail = await thumbnailImage.saveAsync({
		format: SaveFormat.WEBP,
	});

	// Create medium version
	const mediumContext = await ImageManipulator.manipulate(uri);
	mediumContext.resize({ width: IMAGE_SIZES.medium.width });
	const mediumImage = await mediumContext.renderAsync();
	results.medium = await mediumImage.saveAsync({
		format: SaveFormat.WEBP,
	});

	// Original is kept as-is
	results.original = { uri, width: 0, height: 0 };

	return results;
};

// Upload a single image with specified size
const uploadSingleImage = async ({
	uri,
	bucketName,
	path,
	size,
	extension,
	safeFilename,
	dataSession,
}: {
	uri: string;
	bucketName: string;
	path: string;
	size: string;
	extension: string;
	safeFilename: string;
	dataSession: any;
}): Promise<string> => {
	return new Promise(async (resolve, reject) => {
		// Ensure path is properly formatted
		const cleanPath = path.replace(/^\/+|\/+$/g, ""); // Remove leading/trailing slashes
		const sizePrefix = size === "original" ? "" : `${size}_`;
		const objectName = `${cleanPath}/${sizePrefix}${safeFilename}`;

		const blob = await fetch(uri).then((res) => res.blob());
		let upload = new Upload(blob, {
			endpoint: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
			retryDelays: [0, 3000, 5000, 10000, 20000],
			headers: {
				authorization: `Bearer ${dataSession?.session?.access_token}`,
				"x-upsert": "true",
			},
			uploadDataDuringCreation: true,
			removeFingerprintOnSuccess: true,
			metadata: {
				bucketName: bucketName,
				objectName: objectName,
				contentType: getMimeType(extension),
				cacheControl: "3600",
			},
			chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
			onError: function (error) {
				console.log(`Failed to upload ${size} because: ${error}`);
				reject(error);
			},
			onProgress: function (bytesUploaded, bytesTotal) {
				var percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
				console.log(`${size}: ${bytesUploaded}, ${bytesTotal}, ${percentage}%`);
			},
			onSuccess: function () {
				console.log(`Uploaded ${size}: ${objectName}`);
				resolve(objectName);
			},
		});

		// Check if there are any previous uploads to continue.
		upload.findPreviousUploads().then(function (previousUploads) {
			// Found previous uploads so we select the first one.
			if (previousUploads.length) {
				upload.resumeFromPreviousUpload(previousUploads[0]);
			}

			// Start the upload
			upload.start();
		});
	});
};

export const uploadFiles = async ({
	bucketName,
	path,
	pickerResult,
}: {
	bucketName: string;
	path: string;
	pickerResult: ImagePicker.ImagePickerResult;
}) => {
	const uploadedFiles: {
		original?: string;
		thumbnail: string;
		medium: string;
		stone_id?: string;
		organization_id?: string;
	}[] = [];

	if (!pickerResult.assets?.length) return;

	const { data: dataSession } = await supabase.auth.getSession();

	// Process and upload all images (thumbnail and medium only first)
	const priorityUploads = pickerResult.assets.map(
		(file: ImagePicker.ImagePickerAsset) => {
			return new Promise<{
				thumbnailPath: string;
				mediumPath: string;
				originalUri: string;
				extension: string;
				safeFilename: string;
			}>(async (resolve, reject) => {
				try {
					const extension = getFileExtension(file.uri);
					// Ensure filename has no spaces or special characters
					const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

					// Process image into multiple sizes
					const processedImages = await processImage(file.uri);

					// Upload only thumbnail and medium first
					const priorityUploadPromises = [
						uploadSingleImage({
							uri: processedImages.thumbnail.uri,
							bucketName,
							path,
							size: "thumbnail",
							extension,
							safeFilename,
							dataSession,
						}),
						uploadSingleImage({
							uri: processedImages.medium.uri,
							bucketName,
							path,
							size: "medium",
							extension,
							safeFilename,
							dataSession,
						}),
					];

					// Wait for thumbnail and medium to upload
					const [thumbnailPath, mediumPath] = await Promise.all(
						priorityUploadPromises,
					);

					resolve({
						thumbnailPath,
						mediumPath,
						originalUri: processedImages.original.uri,
						extension,
						safeFilename,
					});
				} catch (error) {
					console.error(
						"Error processing and uploading priority images:",
						error,
					);
					reject(error);
				}
			});
		},
	);

	// Wait for all priority uploads to complete
	const priorityResults = await Promise.allSettled(priorityUploads);

	// Process successful priority uploads
	for (const result of priorityResults) {
		if (result.status === "fulfilled") {
			uploadedFiles.push({
				thumbnail: result.value.thumbnailPath,
				medium: result.value.mediumPath,
			});
		}
	}

	if (uploadedFiles.length === 0) return;

	// Extract gemstone ID from the first thumbnail path
	const gemstoneId = uploadedFiles[0].thumbnail.split("/")[1];

	// Get stone information
	const { data: stone } = await supabase
		.from("stones")
		.select("*")
		.is("deleted_at", null)
		.eq("id", gemstoneId)
		.single();

	// Insert records with thumbnail and medium URLs
	const { data, error } = await supabase
		.from("images")
		.insert(
			uploadedFiles.map((file) => ({
				stone_id: gemstoneId,
				organization_id: stone?.organization_id,
				thumbnail: file.thumbnail,
				medium: file.medium,
				// original will be updated later
				original: null,
			})),
		)
		.select();

	if (error) {
		throw error;
	}

	// Start background uploads for original images
	const backgroundUploads = priorityResults
		.filter(
			(result): result is PromiseFulfilledResult<any> =>
				result.status === "fulfilled",
		)
		.map((result, index) => {
			return new Promise<void>(async (resolve) => {
				try {
					// Upload original in background
					const originalPath = await uploadSingleImage({
						uri: result.value.originalUri,
						bucketName,
						path,
						size: "original",
						extension: result.value.extension,
						safeFilename: result.value.safeFilename,
						dataSession,
					});

					// Update the database with the original URL
					if (data && data[index]) {
						await supabase
							.from("images")
							.update({ original: originalPath })
							.eq("id", data[index].id);
					}

					resolve();
				} catch (error) {
					console.error("Error uploading original image in background:", error);
					resolve(); // Resolve anyway to not block other operations
				}
			});
		});

	// Start background uploads but don't wait for them
	Promise.allSettled(backgroundUploads).catch((error) => {
		console.error("Error in background uploads:", error);
	});

	return data;
};
