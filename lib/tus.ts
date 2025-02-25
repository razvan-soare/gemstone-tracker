import { supabase } from "@/config/supabase";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
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
	thumbnail: { width: 200, height: 200 },
	medium: { width: 800, height: 800 },
	// Original size is preserved as-is
};

// Process image into multiple sizes
const processImage = async (
	uri: string,
): Promise<Record<string, ImageManipulator.ImageResult>> => {
	const results: Record<string, ImageManipulator.ImageResult> = {};

	// Create thumbnail version
	results.thumbnail = await ImageManipulator.manipulateAsync(
		uri,
		[{ resize: IMAGE_SIZES.thumbnail }],
		{ compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
	);

	// Create medium version
	results.medium = await ImageManipulator.manipulateAsync(
		uri,
		[{ resize: IMAGE_SIZES.medium }],
		{ compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
	);

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
	const uploadedFiles: { original: string; sizes: Record<string, string> }[] =
		[];

	if (!pickerResult.assets?.length) return;

	const { data: dataSession } = await supabase.auth.getSession();

	const allUploads = pickerResult.assets.map(
		(file: ImagePicker.ImagePickerAsset) => {
			return new Promise<void>(async (resolve, reject) => {
				try {
					const extension = getFileExtension(file.uri);
					// Ensure filename has no spaces or special characters
					const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

					// Process image into multiple sizes
					const processedImages = await processImage(file.uri);

					// Upload each size
					const uploadPromises = Object.entries(processedImages).map(
						([size, result]) =>
							uploadSingleImage({
								uri: result.uri,
								bucketName,
								path,
								size,
								extension,
								safeFilename,
								dataSession,
							}),
					);

					// Wait for all sizes to upload
					const uploadedPaths = await Promise.all(uploadPromises);

					// Create a record of all uploaded sizes
					const originalPath = uploadedPaths[2]; // The original is the third item
					const thumbnailPath = uploadedPaths[0];
					const mediumPath = uploadedPaths[1];

					uploadedFiles.push({
						original: originalPath,
						sizes: {
							thumbnail: thumbnailPath,
							medium: mediumPath,
							original: originalPath,
						},
					});

					resolve();
				} catch (error) {
					console.error("Error processing and uploading image:", error);
					reject(error);
				}
			});
		},
	);

	await Promise.allSettled(allUploads);

	if (uploadedFiles.length === 0) return;

	const gemstoneId = uploadedFiles[0].original.split("/")[1];
	const gemstone = await supabase
		.from("stones")
		.select("*")
		.eq("id", gemstoneId)
		.single();

	// Update the database with the new image information
	// Convert existing pictures to the new format if needed
	const existingPictures = gemstone?.data?.pictures || [];
	const formattedExistingPictures = existingPictures.map(
		(pic: string | { original: string; sizes: Record<string, string> }) => {
			// Check if it's already in the new format
			if (typeof pic === "object" && pic.original) {
				return pic;
			}
			// Convert old format to new format
			return {
				original: pic,
				sizes: {
					original: pic,
					// Old images don't have other sizes
				},
			};
		},
	);

	await supabase
		.from("stones")
		.update({
			pictures: [...formattedExistingPictures, ...uploadedFiles],
		})
		.eq("id", gemstone.data.id);

	return;
};
